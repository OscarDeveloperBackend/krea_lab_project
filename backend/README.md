# KREA LAB — Backend API

API REST para el cálculo de costos, análisis de archivos 3D STL y gestión de órdenes de cotización para tecnologías FDM (Filamento) y SLA/DLP (Resina).

---

## 1. Stack Tecnológico

| Tecnología | Rol |
|---|---|
| **Node.js** (v20+ / v26) | Runtime de JavaScript |
| **TypeScript** | Lenguaje de programación fuertemente tipado |
| **Express** (v5) | Framework HTTP y enrutamiento REST |
| **Prisma** (v7) | ORM para modelado de datos y migraciones |
| **PostgreSQL** (v15) | Base de datos relacional |
| **node-stl** | Parser y analizador volumétrico de mallas STL |
| **pdfmake** | Motor de generación de cotizaciones en PDF |
| **Supabase JS** | Cliente para almacenamiento y servicios cloud |

---

## 2. Arquitectura de Código

El backend implementa una arquitectura en capas limpia (*Clean Architecture*):

```text
backend/
├── prisma/
│   ├── schema.prisma       # Modelos relacionales
│   └── seed.ts             # Sembrado de datos iniciales
├── src/
│   ├── app.ts              # Punto de entrada
│   ├── config/             # Variables de entorno y cliente Prisma
│   ├── domain/             # Entidades, DTOs y errores de dominio
│   ├── repositories/       # Abstracción de acceso a datos Prisma
│   ├── services/           # Lógica y algoritmos de cotización
│   └── presentation/       # Controladores Express y middlewares
├── Dockerfile              # Imagen para producción (multi-stage)
├── Dockerfile.dev          # Imagen para desarrollo con tsx watch
└── docker-compose.yml      # Entorno de desarrollo aislado con PostgreSQL
```

---

## 3. Puesta en Marcha Local (Desarrollo)

### Con Docker Compose (Recomendado):
```bash
# 1. Copiar archivo de entorno
cp .env.template .env

# 2. Iniciar PostgreSQL y servidor Express con hot-reload
docker compose up -d

# 3. Cargar catálogo de materiales y configuración inicial
docker compose exec backend_app npx prisma db seed
```
La API estará disponible en `http://localhost:3100/api`.

### En máquina local:
```bash
npm install
cp .env.template .env
npx prisma migrate dev
npx prisma db seed
npm run dev
```

---

## 4. Endpoints Principales

| Método | Ruta | Descripción |
|---|---|---|
| `GET` | `/api/health` | Estado de salud del servicio |
| `POST` | `/api/stl-calculate` | Analiza archivo `.stl` (volumen, dimensiones, triángulos, hash) |
| `GET` | `/api/configuracion-inicial` | Tarifas, máquinas activas, materiales y métodos de entrega |
| `GET` | `/api/configuracion-general` | Parámetros globales de margen y amortización |
| `PATCH` | `/api/configuracion-general` | Modifica parámetros globales |
| `PATCH` | `/api/configuracion-general/maquinas/:tecnologia` | Parámetros para `FILAMENTO` o `RESINA` |
| `GET` | `/api/material` | Catálogo de materiales disponibles |
| `POST` | `/api/cotizaciones` | Calcula y guarda una nueva cotización |
| `GET` | `/api/cotizaciones` | Listado histórico de cotizaciones |
| `GET` | `/api/cotizaciones/:id` | Detalle completo de orden y despiece |

> **Nota:** La guía de despliegue en servidor VPS, configuración de Nginx / Webuzo y automatización CI/CD se encuentra centralizada en el [README.md principal](file:///README.md) de la raíz del monorepo.
