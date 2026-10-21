#!/usr/bin/env bash
# ==============================================================================
# Script de Entorno de Desarrollo KREA LAB
# Uso: ./dev.sh [start|stop|reset|logs]
# - start : Levanta todo el entorno de desarrollo (primera vez o reinicio)
# - stop  : Detiene y elimina los contenedores de desarrollo
# - reset : Destruye todo (contenedores + volúmenes) y arranca desde cero
# - logs  : Muestra los logs en tiempo real de backend y frontend
# ==============================================================================
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ACTION="${1:-start}"

BLUE='\033[1;34m'
GREEN='\033[1;32m'
RED='\033[1;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()         { echo -e "${BLUE}[KREA-DEV]${NC} $(date '+%H:%M:%S') $1"; }
log_ok()      { echo -e "${GREEN}[KREA-DEV]${NC} $(date '+%H:%M:%S') $1"; }
log_warn()    { echo -e "${YELLOW}[KREA-DEV]${NC} $(date '+%H:%M:%S') $1"; }
log_error()   { echo -e "${RED}[KREA-DEV]${NC} $(date '+%H:%M:%S') $1" >&2; }

# ── Requisitos ──────────────────────────────────────────────────────────────
check_requirements() {
  if ! command -v docker &>/dev/null; then
    log_error "Docker no está instalado."
    exit 1
  fi
  if ! docker compose version &>/dev/null; then
    log_error "Docker Compose v2 no está instalado."
    exit 1
  fi
  if ! command -v npm &>/dev/null; then
    log_error "npm no está instalado. Instala Node.js 20+ desde https://nodejs.org"
    exit 1
  fi
}

# ── Preparar .env del backend ────────────────────────────────────────────────
prepare_backend_env() {
  if [ ! -f "$SCRIPT_DIR/backend/.env" ]; then
    log_warn "No existe backend/.env. Creando desde .env.template..."
    cp "$SCRIPT_DIR/backend/.env.template" "$SCRIPT_DIR/backend/.env"
    log_ok "Archivo backend/.env creado. Revísalo si necesitas cambiar credenciales."
  else
    log "backend/.env ya existe, se respetan los valores actuales."
  fi
}

# ── Instalar dependencias del backend si faltan ──────────────────────────────
prepare_backend_deps() {
  if [ ! -d "$SCRIPT_DIR/backend/node_modules" ]; then
    log "Instalando dependencias del backend..."
    (cd "$SCRIPT_DIR/backend" && npm install)
    log_ok "Dependencias del backend instaladas."
  else
    log "node_modules del backend ya existen."
  fi
}

# ── Instalar dependencias del frontend si faltan ─────────────────────────────
prepare_frontend_deps() {
  if [ ! -d "$SCRIPT_DIR/frontend/node_modules" ]; then
    log "Instalando dependencias del frontend (Angular)..."
    (cd "$SCRIPT_DIR/frontend" && npm install)
    log_ok "Dependencias del frontend instaladas."
  else
    log "node_modules del frontend ya existen."
  fi
}

# ── Levantar Todo con Docker (DB + Backend + Frontend) ─────────────────────
start_docker_services() {
  log "Levantando Base de Datos, Backend y Frontend con Docker en segundo plano..."
  (cd "$SCRIPT_DIR/backend" && docker compose up -d --build)
  (cd "$SCRIPT_DIR/frontend" && docker compose up -d --build)
  log_ok "Contenedores levantados en segundo plano."
}

# ── Esperar que el backend responda ─────────────────────────────────────────
wait_backend_healthy() {
  log "Esperando que el backend esté disponible en http://localhost:3100..."
  local max=30
  local i=1
  while [ $i -le $max ]; do
    if curl -sf http://localhost:3100/api/health &>/dev/null; then
      log_ok "Backend disponible y saludable."
      return 0
    fi
    echo -n "."
    sleep 2
    i=$((i + 1))
  done
  echo ""
  log_warn "El backend tardó más de lo esperado. Revisa los logs con: ./dev.sh logs"
}

# ── Esperar que el frontend responda ────────────────────────────────────────
wait_frontend_healthy() {
  log "Esperando que el frontend esté listo en http://localhost:4200..."
  local max=45
  local i=1
  while [ $i -le $max ]; do
    if curl -sf http://localhost:4200 &>/dev/null; then
      log_ok "Frontend listo y respondiendo en http://localhost:4200."
      return 0
    fi
    echo -n "."
    sleep 2
    i=$((i + 1))
  done
  echo ""
  log_warn "El frontend sigue iniciando en segundo plano. Revisa logs con: ./dev.sh logs"
}

# ── Ejecutar migraciones y seed de la base de datos ─────────────────────────
run_migrations_and_seed() {
  log "Ejecutando migraciones de Prisma..."
  (cd "$SCRIPT_DIR/backend" && docker compose exec backend_app sh -c "npx prisma migrate deploy")
  log_ok "Migraciones aplicadas."

  log "Ejecutando seed inicial (materiales, configuración general y máquinas)..."
  (cd "$SCRIPT_DIR/backend" && docker compose exec backend_app sh -c "npx prisma db seed")
  log_ok "Datos iniciales cargados correctamente."
}

# ── Detener contenedores de desarrollo ──────────────────────────────────────
stop_dev() {
  log "Deteniendo todos los contenedores de desarrollo..."
  (cd "$SCRIPT_DIR/frontend" && docker compose down) 2>/dev/null || true
  (cd "$SCRIPT_DIR/backend" && docker compose down)
  log_ok "Todos los contenedores detenidos."
}

# ── Reset completo (borra volúmenes = base de datos se reinicia) ─────────────
reset_dev() {
  log_warn "ATENCIÓN: Esto destruirá todos los datos de desarrollo en la base de datos."
  read -r -p "¿Estás seguro? (escribe 'si' para confirmar): " confirm
  if [ "$confirm" != "si" ]; then
    log "Operación cancelada."
    exit 0
  fi
  log "Destruyendo contenedores y volúmenes de desarrollo..."
  (cd "$SCRIPT_DIR/frontend" && docker compose down -v) 2>/dev/null || true
  (cd "$SCRIPT_DIR/backend" && docker compose down -v)
  log_ok "Reset completado. Ejecuta './dev.sh' para volver a iniciar."
}

# ── Logs en tiempo real ──────────────────────────────────────────────────────
show_logs() {
  log "Mostrando logs de desarrollo (Ctrl+C para salir)..."
  (cd "$SCRIPT_DIR/backend" && docker compose logs -f) &
  (cd "$SCRIPT_DIR/frontend" && docker compose logs -f)
}

# ── Acción principal ─────────────────────────────────────────────────────────
check_requirements

case "$ACTION" in
  start)
    log "=== Iniciando entorno de desarrollo KREA LAB ==="
    prepare_backend_env
    prepare_backend_deps
    prepare_frontend_deps
    start_docker_services
    wait_backend_healthy
    run_migrations_and_seed
    wait_frontend_healthy
    echo ""
    log_ok "========================================================="
    log_ok "  Backend API : http://localhost:3100/api/health"
    log_ok "  Frontend    : http://localhost:4200"
    log_ok "  DB          : PostgreSQL (puerto 5432)"
    log_ok "========================================================="
    log "Todos los servicios están corriendo en segundo plano."
    log "Para ver los logs en cualquier momento: ./dev.sh logs"
    log "Para detener todo: ./dev.sh stop"
    ;;
  stop)
    stop_dev
    ;;
  reset)
    reset_dev
    ;;
  logs)
    show_logs
    ;;
  *)
    echo "Uso: ./dev.sh [start|stop|reset|logs]"
    echo "  start  - Levanta todo el entorno de desarrollo"
    echo "  stop   - Detiene los contenedores"
    echo "  reset  - Destruye volúmenes y reinicia desde cero"
    echo "  logs   - Muestra logs del backend en tiempo real"
    exit 1
    ;;
esac
