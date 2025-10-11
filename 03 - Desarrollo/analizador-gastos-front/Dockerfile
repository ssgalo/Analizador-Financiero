# Multi-stage build para el frontend

# Etapa 1: Build
FROM node:18-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./

# Instalar dependencias
RUN npm ci

# Copiar código fuente
COPY . .

# Recibir argumentos de build
ARG VITE_API_URL
ARG VITE_APP_NAME
ARG VITE_ENV

# Establecer variables de entorno para el build
ENV VITE_API_URL=${VITE_API_URL}
ENV VITE_APP_NAME=${VITE_APP_NAME}
ENV VITE_ENV=${VITE_ENV}

# Build de la aplicación
RUN npm run build

# Etapa 2: Producción
FROM nginx:alpine

# Copiar archivos build
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuración de nginx
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Crear script para inyectar variables de entorno en runtime
RUN cat > /docker-entrypoint.d/40-generate-env.sh <<'EOF'
#!/bin/sh
cat > /usr/share/nginx/html/env-config.js <<ENVEOF
window._env_ = {
  VITE_API_URL: "${VITE_API_URL}",
  VITE_APP_NAME: "${VITE_APP_NAME}",
  VITE_ENV: "${VITE_ENV}"
};
ENVEOF
EOF

RUN chmod +x /docker-entrypoint.d/40-generate-env.sh

# Exponer puerto 80
EXPOSE 80

# Comando por defecto
CMD ["nginx", "-g", "daemon off;"]
