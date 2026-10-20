# KREA LAB — Frontend

Aplicación cliente en **Angular 20** para el sistema de cotización de impresión 3D (FDM y Resina) de KREA LAB. Permite a los clientes y operarios cargar modelos 3D STL, visualizarlos interactivamente, seleccionar tecnologías y materiales, configurar parámetros y generar órdenes de cotización.

---

## 1. Tecnologías y Versiones Verificadas

| Tecnología | Versión | Rol |
|---|---|---|
| **Angular** | `^20.3.0` | Framework web reactivo con Signals y Standalone Components |
| **Angular CLI** | `^20.3.37` | Herramienta de compilación y empaquetado |
| **TailwindCSS** | `^4.3.3` | Framework de utilidades CSS con `@tailwindcss/postcss` |
| **PostCSS** | `^8.5.28` | Procesamiento moderno de estilos CSS |
| **angular-stl-model-viewer** | `^14.0.0` | Renderizado interactivo WebGL de archivos STL 3D |
| **RxJS** | `~7.8.0` | Manejo de flujos reactivos |
| **TypeScript** | `~5.9.2` | Lenguaje tipado |
| **Nginx** | `1.27-alpine` (Docker) | Servidor web HTTP y enrutamiento SPA en producción |

---

## 2. Requisitos Previos

- **Node.js:** Versión 20.x o 22.x LTS (o Docker para ejecución contenida).
- **npm:** Versión 10+.
- **Angular CLI:** `npm install -g @angular/cli@20.3.37` (opcional si usas npm scripts locales).

---

## 3. Instalación y Ejecución Local

### Opción A: Ejecución en Host Local
```bash
# 1. Instalar dependencias
npm install

# 2. Iniciar servidor de desarrollo con recarga en caliente
npm start
# o: ng serve --host 0.0.0.0 --port 4200
```
La aplicación quedará disponible en `http://localhost:4200`.

### Opción B: Ejecución con Docker para Desarrollo
```bash
# Levantar el contenedor de desarrollo con montaje de volúmenes y polling
docker compose up -d

# Visualizar logs
docker compose logs -f frontend
```

---

## 4. Comandos de Desarrollo, Pruebas y Compilación

Disponibles en el `package.json`:

- `npm start`: Inicia el servidor de desarrollo (`ng serve --host 0.0.0.0 --port 4200 --poll 2000`).
- `npm run build`: Compila la aplicación en modo producción en la carpeta `dist/krea_lab_frontend/browser`.
- `npm run watch`: Compila en modo desarrollo y observa cambios (`--watch --configuration development`).
- `npm test`: Ejecuta las pruebas unitarias con el test runner Karma y Jasmine.

---

## 5. Variables de Entorno y Configuración de la API

La conexión con la API del backend se gestiona a través de los archivos en `src/environments/`:

- **Desarrollo:** `src/environments/environment.development.ts`:
  ```typescript
  export const environment = {
    production: false,
    apiBaseUrl: 'http://localhost:3100/api',
  };
  ```
- **Producción:** `src/environments/environment.ts`:
  ```typescript
  export const environment = {
    production: true,
    apiBaseUrl: 'http://localhost:3100/api', // o la URL pública configurada para la API: '/api' o 'https://api.tudominio.com/api'
  };
  ```

> **Nota para producción en VPS con Webuzo:**
> Si Webuzo expone la API bajo la misma ruta de dominio (ej. `https://tudominio.com/api`), se puede configurar `apiBaseUrl: '/api'` para evitar problemas de CORS y certificados cruzados. Si la API se aloja en subdominio, indicar `https://api.tudominio.com/api`.

---

## 6. Docker para Desarrollo

El archivo `Dockerfile.dev` utiliza `node:26.8.1-slim` con `@angular/cli@20.3.37` preinstalado.
El archivo `docker-compose.yml` en la raíz de este repositorio monta el código fuente localmente y preserva `node_modules` en un volumen anónimo para garantizar hot-reload sin interferencias:

```bash
docker compose up --build
```

---

## 7. Docker para Producción

El archivo `Dockerfile` de producción utiliza un enfoque multi-etapa (*multi-stage build*):
1. **Etapa 1 (builder):** `node:26.8.1-slim` instala dependencias y ejecuta `npm run build -- --configuration=production`.
2. **Etapa 2 (runner):** `nginx:1.27-alpine` copia los artefactos estáticos generados en `dist/krea_lab_frontend/browser` a `/usr/share/nginx/html` y utiliza `nginx.conf`.
3. **Manejo de SPA:** `nginx.conf` redirige todas las rutas desconocidas a `/index.html` (`try_files $uri $uri/ /index.html;`) para permitir el enrutamiento interno de Angular Router sin errores 404.
4. **Healthcheck:** El contenedor expone un endpoint `/health` que responde `200 healthy` para validar su disponibilidad.

Para probar la imagen de producción localmente:
```bash
docker build -t krea_lab_frontend:prod .
docker run -d -p 8080:80 --name test_frontend krea_lab_frontend:prod
curl http://localhost:8080/health
```

---

## 8. Flujo de Despliegue Automático con GitHub Actions

El repositorio cuenta con el flujo de CI/CD `.github/workflows/frontend-ci-cd.yml`:

1. Al hacer `push` a la rama de producción (`main` o `master`), GitHub Actions:
   - Descarga el código y valida dependencias con `npm ci`.
   - Ejecuta la compilación de producción `npm run build -- --configuration=production`.
   - Si la compilación falla (errores de tipado, plantillas o sintaxis), el flujo se detiene y **no** despliega.
   - Si la compilación es exitosa, se conecta vía SSH al VPS usando credenciales seguras de GitHub Secrets.
2. En el VPS, actualiza el repositorio local en `krea_lab_frontend` y ejecuta:
   ```bash
   ./deploy.sh frontend
   ```
3. El script de despliegue reconstruye únicamente la imagen del frontend y reinicia únicamente el contenedor `frontend_app` sin tocar el backend ni reiniciar la base de datos PostgreSQL.
4. Comprueba el healthcheck en `http://localhost/health`.

---

## 9. Secretos Requeridos en GitHub Actions

En el repositorio de GitHub (**Settings -> Secrets and variables -> Actions**), configurar:
- `SSH_HOST`: IP o host del servidor VPS.
- `SSH_USER`: Usuario con acceso SSH (ej. `deploy`).
- `SSH_PRIVATE_KEY`: Clave privada SSH.
- `SSH_PORT`: Puerto SSH (opcional, default `22`).
- `VPS_PROJECT_DIR`: Directorio central del proyecto en el VPS (ej. `/home/deploy/krea_lab`).

---

## 10. Diagnóstico de Problemas Frecuentes

- **Error al refrescar la página (Error 404):**
  Ocurre si el servidor web no redirige las rutas al `index.html`. En producción, esto ya está resuelto en `nginx.conf` mediante `try_files $uri $uri/ /index.html;`.
- **Error de conexión con la API (ERR_CONNECTION_REFUSED):**
  Verifica que el backend esté arriba (`curl http://127.0.0.1:3100/api/health`) y que la URL en `src/environments/environment.ts` apunte a la ruta accesible desde el navegador del cliente (la red Docker es interna; el navegador ejecuta en la máquina del usuario final).
- **Error en compilación de Tailwind v4:**
  Tailwind v4 utiliza `@tailwindcss/postcss`. Asegúrate de que `.postcssrc.json` contenga `@tailwindcss/postcss`.
