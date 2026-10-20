# Multi-stage Dockerfile for Angular production
ARG NODE_VERSION=26.8.1

# Stage 1: Build Angular application
FROM node:${NODE_VERSION}-slim AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build -- --configuration=production

# Stage 2: Serve with Nginx unprivileged / alpine
FROM nginx:1.27-alpine AS runner

# Remover configuración por defecto
RUN rm -rf /etc/nginx/conf.d/* /usr/share/nginx/html/*

# Copiar configuración personalizada de Nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copiar artefactos compilados por Angular
COPY --from=builder /app/dist/krea_lab_frontend/browser /usr/share/nginx/html

# Agregar curl para comprobación de salud
RUN apk add --no-cache curl

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
