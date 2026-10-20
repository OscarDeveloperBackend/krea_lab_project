# KREA LAB — Monorepo

Sistema integral de cotización y gestión de producción para impresión 3D profesional (tecnologías **FDM - Filamento** y **SLA/DLP - Resina**).

Este repositorio está estructurado como un **Monorepo** que unifica:
- **`backend/`**: API REST en Node.js, Express, TypeScript y Prisma ORM con PostgreSQL.
- **`frontend/`**: Aplicación Web SPA en Angular 20, Signals y TailwindCSS.
- **Orquestación de Producción**: Docker Compose, scripts de despliegue con rollback y flujos de CI/CD para VPS Linux (Webuzo).

---

## 1. Estructura del Proyecto

```text
KREA_LAB_PROJECT/
├── backend/                       # API Node.js / Express / Prisma
├── frontend/                      # Cliente SPA Angular 20
├── docker-compose.prod.yml        # Orquestación de producción (PostgreSQL + Backend + Frontend)
├── deploy.sh                      # Script de despliegue atómico con rollback y bloqueo (flock)
├── .env.production.template       # Plantilla de variables de producción
├── .gitignore                     # Ignora secretos, node_modules y builds
└── .github/
    └── workflows/
        ├── backend-ci-cd.yml      # CI/CD automático para backend (activa en backend/**)
        └── frontend-ci-cd.yml     # CI/CD automático para frontend (activa en frontend/**)
```

---

## 2. Puesta en Marcha en Desarrollo (Local)

Tienes dos alternativas para trabajar en desarrollo:

### Opción A: Modo Desarrollo con Docker (Todo Levanta Rápido)

Cada servicio cuenta con su propio entorno de desarrollo preparado:

1. **Levantar Backend y Base de Datos (PostgreSQL):**
   ```bash
   cd backend
   cp .env.template .env
   docker compose up -d
   ```
   > Disponible en `http://localhost:3100`. El seed inicial de prueba se ejecuta con:  
   > `docker compose exec backend_app npx prisma db seed`

2. **Levantar Frontend (Angular):**
   ```bash
   cd ../frontend
   npm install
   npm start
   ```
   > Disponible en `http://localhost:4200` con recarga automática en caliente.

---

### Opción B: Modo Desarrollo Nativo (Sin Docker para Node.js)

1. **Asegurar base de datos PostgreSQL** corriendo en el puerto `5432`.
2. **Backend:**
   ```bash
   cd backend
   cp .env.template .env
   npm install
   npx prisma migrate dev
   npx prisma db seed
   npm run dev
   ```
3. **Frontend:**
   ```bash
   cd frontend
   npm install
   npm start
   ```

---

## 3. Puesta en Marcha en Producción (Un Solo Comando)

En un entorno de producción (o para simular producción localmente con Docker Compose):

### Paso 1: Configurar Variables de Entorno
Copia la plantilla y define tus credenciales:
```bash
cp .env.production.template .env
chmod 600 .env
```

Configura en `.env`:
```env
POSTGRES_USER=krealab_admin
POSTGRES_PASSWORD=Genera_Un_Password_Muy_Seguro_Aqui
POSTGRES_DB=krealab_db
FRONTEND_PORT=8080
BACKEND_PORT=3100
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_KEY=tu-service-key-secreta
```

### Paso 2: Levantar Todo el Stack
Con un solo comando compilas y arrancas PostgreSQL, Backend y Frontend en red privada:
```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### Paso 3: Ejecutar Migraciones de Base de Datos
```bash
docker compose -f docker-compose.prod.yml run --rm --no-deps backend_app sh -c "npx prisma migrate deploy"
```
*(Opcional: cargar catálogo de materiales inicial con `npx prisma db seed`).*

---

## 4. Despliegues en Servidor VPS (Webuzo)

El script `./deploy.sh` incluido en la raíz gestiona el despliegue con exclusión mutua (`flock`), migraciones aisladas y comprobación de salud (*healthchecks*) con rollback automático:

- **Desplegar o actualizar todo:**
  ```bash
  ./deploy.sh all
  ```
- **Actualizar únicamente el backend:**
  ```bash
  ./deploy.sh backend
  ```
- **Actualizar únicamente el frontend:**
  ```bash
  ./deploy.sh frontend
  ```

### Verificación de Salud
```bash
# Backend
curl http://127.0.0.1:3100/api/health

# Frontend
curl http://127.0.0.1:8080/health

# Base de datos
docker compose -f docker-compose.prod.yml ps
```

---

## 5. Automatización CI/CD con GitHub Actions

Cuando hagas `git push` a `main`:
- Si los cambios son en `backend/**`, se ejecuta [.github/workflows/backend-ci-cd.yml](file:///.github/workflows/backend-ci-cd.yml) y solo actualiza el backend.
- Si los cambios son en `frontend/**`, se ejecuta [.github/workflows/frontend-ci-cd.yml](file:///.github/workflows/frontend-ci-cd.yml) y solo actualiza el frontend.

### Secretos requeridos en el repositorio GitHub:
- `SSH_HOST`: IP o host del VPS.
- `SSH_USER`: Usuario SSH con permisos Docker (`deploy`).
- `SSH_PRIVATE_KEY`: Clave privada SSH.
- `SSH_PORT`: Puerto SSH (habitualmente `22`).
- `VPS_PROJECT_DIR`: Ruta del proyecto en el servidor (ej. `/home/deploy/krea_lab`).
