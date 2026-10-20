#!/usr/bin/env bash
# ==============================================================================
# Script de Despliegue Selectivo KREA LAB para VPS Linux (Webuzo / Docker)
# Uso: ./deploy.sh [frontend|backend|all]
# ==============================================================================
set -euo pipefail

TARGET="${1:-all}"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOCK_FILE="/tmp/krea_lab_deploy.lock"
LOCK_TIMEOUT_SECONDS=180

log() {
  echo -e "\033[1;34m[KREA-DEPLOY]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
  echo -e "\033[1;31m[KREA-ERROR]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1" >&2
}

log_success() {
  echo -e "\033[1;32m[KREA-SUCCESS]\033[0m $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 1. Mecanismo de bloqueo global de exclusión mutua
exec 200>"$LOCK_FILE"
log "Solicitando lock global de despliegue (espera máxima: ${LOCK_TIMEOUT_SECONDS}s)..."
if ! flock -w "$LOCK_TIMEOUT_SECONDS" 200; then
  log_error "Tiempo de espera agotado (${LOCK_TIMEOUT_SECONDS}s). Otro despliegue sigue en ejecución (Lock: $LOCK_FILE)."
  exit 1
fi
log_success "Lock global de despliegue adquirido exitosamente."

log "Iniciando proceso para objetivo: $TARGET"
log "Directorio base: $SCRIPT_DIR"

# 2. Sincronización atómica y protegida del Monorepo Git bajo el Lock
cd "$SCRIPT_DIR"

if [ -d ".git" ]; then
  log "Actualizando repositorio monorepo desde origin..."
  git fetch origin main || true
  git reset --hard origin/main || true
  chmod +x deploy.sh || true
fi

# 3. Verificaciones previas del entorno
if ! command -v docker &> /dev/null; then
  log_error "Docker no está instalado o no se encuentra en el PATH."
  exit 1
fi

if ! docker compose version &> /dev/null; then
  log_error "Docker Compose v2 no está instalado o no responde."
  exit 1
fi

if [ ! -f "docker-compose.prod.yml" ]; then
  log_error "No se encontró el archivo docker-compose.prod.yml en $SCRIPT_DIR"
  exit 1
fi

if [ ! -f ".env" ]; then
  log_error "No se encontró el archivo .env con las variables de producción en $SCRIPT_DIR"
  log_error "Copia .env.production.template a .env y define los valores reales."
  exit 1
fi

# 4. Función de verificación de salud
wait_for_service() {
  local service_name="$1"
  local container_name="$2"
  local max_attempts="${3:-20}"
  local attempt=1

  log "Verificando estado de salud del contenedor $container_name ($service_name)..."
  while [ $attempt -le $max_attempts ]; do
    local status
    status=$(docker inspect --format='{{json .State.Health.Status}}' "$container_name" 2>/dev/null || echo "\"not_found\"")
    status="${status%\"}"
    status="${status#\"}"

    if [ "$status" = "healthy" ]; then
      log_success "Contenedor $container_name está HEALTHY."
      return 0
    elif [ "$status" = "unhealthy" ]; then
      log_error "Contenedor $container_name falló el healthcheck (UNHEALTHY)."
      docker logs --tail 40 "$container_name" || true
      return 1
    fi

    log "Esperando que $container_name esté healthy... Intento $attempt/$max_attempts (Estado actual: $status)"
    sleep 3
    attempt=$((attempt + 1))
  done

  log_error "Tiempo de espera agotado esperando que $container_name esté healthy."
  docker logs --tail 40 "$container_name" || true
  return 1
}

# 5. Asegurar que la base de datos esté activa antes de cualquier backend
ensure_database() {
  log "Verificando estado de PostgreSQL..."
  docker compose -f docker-compose.prod.yml up -d postgres_db
  wait_for_service "postgres_db" "krea_lab_postgres_prod" 15
}

# 6. Función de despliegue seguro con rollback automático de imagen
deploy_service_with_rollback() {
  local service_name="$1"
  local container_name="$2"
  local image_name="$3"
  local max_wait_attempts="${4:-20}"

  log "--- Desplegando $service_name de forma segura ---"

  # Guardar referencia inmutable (Image ID) de la versión actualmente en ejecución
  local previous_image_id=""
  if docker inspect "$container_name" &>/dev/null; then
    previous_image_id=$(docker inspect --format='{{.Image}}' "$container_name" 2>/dev/null || echo "")
  fi

  if [ -n "$previous_image_id" ]; then
    log "Versión anterior detectada (ID: ${previous_image_id:0:19}). Etiquetando como ${image_name}:rollback-backup..."
    docker tag "$previous_image_id" "${image_name}:rollback-backup" || true
  else
    log "No se detectó contenedor previo en ejecución para $service_name. Primer despliegue."
  fi

  # Construir la nueva imagen de producción
  log "Construyendo nueva imagen para $service_name..."
  docker compose -f docker-compose.prod.yml build "$service_name"

  # Reemplazar el contenedor con la nueva versión
  log "Iniciando $service_name con la nueva versión..."
  docker compose -f docker-compose.prod.yml up -d --no-deps "$service_name"

  # Comprobar salud del nuevo contenedor
  if ! wait_for_service "$service_name" "$container_name" "$max_wait_attempts"; then
    log_error "¡ALERTA! El nuevo contenedor de $service_name falló o quedó UNHEALTHY."

    if [ -n "$previous_image_id" ] && docker image inspect "${image_name}:rollback-backup" &>/dev/null; then
      log_error "Iniciando ROLLBACK automático a la versión anterior (${image_name}:rollback-backup)..."
      docker tag "${image_name}:rollback-backup" "${image_name}:latest"
      docker compose -f docker-compose.prod.yml up -d --no-deps "$service_name"

      if wait_for_service "$service_name" "$container_name" 15; then
        local restored_id
        restored_id=$(docker inspect --format='{{.Image}}' "$container_name" 2>/dev/null || echo "")
        log_success "Rollback completado exitosamente. La versión anterior de $service_name está operativa y HEALTHY (Image ID: ${restored_id:0:19})."
      else
        log_error "CRÍTICO: El rollback falló al estabilizar el contenedor restaurado. Requiere inspección manual con 'docker logs $container_name'."
      fi
    else
      log_error "No existe imagen de backup previa disponible para ejecutar rollback automático de $service_name."
    fi

    log_error "El despliegue de $service_name ha sido ABORTADO por fallas de salud."
    exit 1
  fi

  log_success "Servicio $service_name desplegado y verificado exitosamente."
}

# 7. Ejecución selectiva
case "$TARGET" in
  backend)
    log "Procesando despliegue de BACKEND..."

    if [ ! -d "backend" ]; then
      log_error "Directorio backend no existe."
      exit 1
    fi

    ensure_database

    log "Construyendo imagen del backend para ejecutar migraciones pendientes de Prisma..."
    docker compose -f docker-compose.prod.yml build backend_app

    log "Ejecutando migraciones de Prisma en contenedor efímero..."
    docker compose -f docker-compose.prod.yml run --rm --no-deps backend_app sh -c "npx prisma migrate deploy"
    log_success "Migraciones de Prisma verificadas y aplicadas exitosamente."

    deploy_service_with_rollback "backend_app" "krea_lab_backend_prod" "krea_lab_backend" 20
    ;;

  frontend)
    log "Procesando despliegue de FRONTEND..."

    if [ ! -d "frontend" ]; then
      log_error "Directorio frontend no existe."
      exit 1
    fi

    deploy_service_with_rollback "frontend_app" "krea_lab_frontend_prod" "krea_lab_frontend" 15
    ;;

  all)
    log "Procesando despliegue COMPLETO (Database, Backend, Frontend)..."

    ensure_database

    log "Ejecutando migraciones de base de datos..."
    docker compose -f docker-compose.prod.yml build backend_app
    docker compose -f docker-compose.prod.yml run --rm --no-deps backend_app sh -c "npx prisma migrate deploy"

    deploy_service_with_rollback "backend_app" "krea_lab_backend_prod" "krea_lab_backend" 20
    deploy_service_with_rollback "frontend_app" "krea_lab_frontend_prod" "krea_lab_frontend" 15

    log_success "¡Todos los servicios desplegados, verificados y operando exitosamente!"
    ;;

  *)
    log_error "Opción desconocida: $TARGET. Usa: ./deploy.sh [frontend|backend|all]"
    exit 1
    ;;
esac

log_success "Operación de despliegue finalizada exitosamente."
