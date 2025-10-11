# 🐧 Guía Completa de Deployment - Linux y VPS

Guía completa para ejecutar la aplicación Analizador Financiero en Linux local y desplegar en VPS con SSL (Let's Encrypt).

---

## 📑 Tabla de Contenidos

1. [Deployment Local en Linux](#deployment-local-en-linux)
2. [Deployment en VPS (Producción)](#deployment-en-vps-producción)
3. [Comandos Útiles](#comandos-útiles)
4. [Troubleshooting](#troubleshooting)
5. [Mantenimiento y Monitoreo](#mantenimiento-y-monitoreo)

---

# PARTE 1: Deployment Local en Linux

## 📋 Paso 1: Instalar Docker y Docker Compose

### 1.1 Actualizar el Sistema
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Instalar Docker
```bash
# Eliminar versiones antiguas si existen
sudo apt remove docker docker-engine docker.io containerd runc

# Instalar dependencias
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Agregar la clave GPG oficial de Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Configurar el repositorio
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 1.3 Configurar Docker sin sudo (Opcional pero Recomendado)
```bash
# Agregar tu usuario al grupo docker
sudo usermod -aG docker $USER

# Aplicar cambios (requiere cerrar sesión y volver a entrar, o ejecutar):
newgrp docker

# Verificar que funciona sin sudo
docker run hello-world
```

### 1.4 Habilitar Docker al Inicio
```bash
sudo systemctl enable docker
sudo systemctl start docker
```

### 1.5 Verificar Instalación
```bash
docker --version
docker compose version

# Deberías ver algo como:
# Docker version 24.x.x
# Docker Compose version v2.x.x
```

---

## 📋 Paso 2: Preparar el Proyecto

### 2.1 Navegar a la Carpeta del Proyecto
```bash
cd ~/Analizador-Financiero/03\ -\ Desarrollo
# O la ruta donde tengas el proyecto
```

### 2.2 Generar SECRET_KEY Seguro
```bash
# Generar SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"
# Guarda este valor para usarlo en el .env
```

### 2.3 Generar Contraseña Segura para PostgreSQL
```bash
# Generar contraseña aleatoria
openssl rand -base64 24
# Guarda este valor para DB_PASSWORD
```

### 2.4 Crear Archivo `.env`
```bash
# Crear el archivo .env desde cero
nano .env
```

### 2.5 Configurar `.env` para Desarrollo Local
Pega el siguiente contenido y **cambia los valores marcados**:

```bash
# ============================================================================
# BASE DE DATOS POSTGRESQL
# ============================================================================
DB_NAME=analizador_financiero
DB_USER=postgres
DB_PASSWORD=TU_PASSWORD_SEGURA_AQUI  # ⚠️ CAMBIA ESTO
DB_SERVER=postgres
DB_PORT=5432
DATABASE_URL=postgresql://postgres:TU_PASSWORD_SEGURA_AQUI@postgres:5432/analizador_financiero  # ⚠️ CAMBIA ESTO

# ============================================================================
# BACKEND - SEGURIDAD
# ============================================================================
SECRET_KEY=TU_SECRET_KEY_GENERADA_AQUI  # ⚠️ CAMBIA ESTO (32+ caracteres)
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ============================================================================
# BACKEND - CORS
# ============================================================================
BACKEND_CORS_ORIGINS=http://localhost:3000,http://localhost,http://localhost:80

# ============================================================================
# FRONTEND
# ============================================================================
VITE_API_URL=http://localhost/api/v1
VITE_APP_NAME=Analizador Financiero
VITE_ENV=development

# ============================================================================
# NGINX
# ============================================================================
NGINX_HOST=localhost
NGINX_PORT=80
NGINX_SSL_PORT=443

# ============================================================================
# DOCKER
# ============================================================================
DOCKER_IMAGE_TAG=latest
COMPOSE_PROJECT_NAME=analizador-financiero

# ============================================================================
# ADICIONAL
# ============================================================================
LOG_LEVEL=INFO
DEBUG_MODE=false
TZ=America/Argentina/Buenos_Aires
```

**Guarda el archivo:**
- En nano: `Ctrl + O`, Enter, `Ctrl + X`
- En vim: `Esc`, `:wq`, Enter

---

## 📋 Paso 3: Construir y Levantar

### 3.1 Construir las Imágenes
```bash
# Construir todas las imágenes
docker compose build
```

### 3.2 Levantar los Contenedores
```bash
# Levantar todos los servicios en segundo plano
docker compose up -d
```

### 3.3 Verificar que Todo Esté Corriendo
```bash
# Ver estado
docker compose ps

# Ver logs
docker compose logs -f
```

### 3.4 Acceder a la Aplicación
```bash
# Test de health check
curl http://localhost/api/v1/health

# Test del frontend
curl -I http://localhost
```

**URLs Disponibles:**
- Frontend: http://localhost
- Backend API: http://localhost/api/v1
- Docs: http://localhost/docs

---

# PARTE 2: Deployment en VPS (Producción)

## 🚀 Requisitos Previos

- VPS con Ubuntu 20.04+ o Debian 11+
- Acceso SSH como root o usuario con sudo
- Dominio apuntando a la IP del VPS (A record configurado)
- Puertos 80 y 443 abiertos

---

## 📋 Paso 1: Preparar el VPS

### 1.1 Conectarse al VPS
```bash
# Desde tu máquina local
ssh usuario@IP_DEL_VPS

# O si usas archivo de clave
ssh -i /ruta/a/tu/clave.pem usuario@IP_DEL_VPS
```

### 1.2 Actualizar el Sistema
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Instalar Dependencias Básicas
```bash
sudo apt install -y \
    curl \
    wget \
    git \
    vim \
    nano \
    ufw \
    htop
```

---

## 📋 Paso 2: Instalar Docker en VPS

### 2.1 Instalar Docker
```bash
# Eliminar versiones antiguas
sudo apt remove docker docker-engine docker.io containerd runc

# Instalar dependencias
sudo apt install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Agregar clave GPG de Docker
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# Configurar repositorio
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

### 2.2 Configurar Docker
```bash
# Agregar usuario al grupo docker
sudo usermod -aG docker $USER

# Habilitar Docker al inicio
sudo systemctl enable docker
sudo systemctl start docker

# Aplicar cambios de grupo
newgrp docker

# Verificar instalación
docker --version
docker compose version
```

---

## 📋 Paso 3: Configurar Firewall (UFW)

```bash
# Configurar firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH (¡IMPORTANTE! No te bloquees)
sudo ufw allow 22/tcp
sudo ufw allow ssh

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Verificar estado
sudo ufw status verbose
```

**Salida esperada:**
```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

---

## 📋 Paso 4: Clonar el Proyecto en VPS

### 4.1 Clonar desde GitHub
```bash
# Navegar al directorio home
cd ~

# Clonar el repositorio
git clone https://github.com/ssgalo/Analizador-Financiero.git

# Entrar a la carpeta del proyecto
cd Analizador-Financiero/03\ -\ Desarrollo
```

### 4.2 O Subir desde Local (Alternativa)
```bash
# Desde tu máquina local, comprimir el proyecto
cd ~/Analizador-Financiero
tar -czf analizador.tar.gz "03 - Desarrollo"

# Subir al VPS
scp analizador.tar.gz usuario@IP_DEL_VPS:~

# En el VPS, descomprimir
ssh usuario@IP_DEL_VPS
cd ~
tar -xzf analizador.tar.gz
cd "03 - Desarrollo"
```

---

## 📋 Paso 5: Configurar Variables de Entorno para Producción

### 5.1 Generar Valores Seguros
```bash
# Generar SECRET_KEY
python3 -c "import secrets; print(secrets.token_urlsafe(32))"

# Generar DB_PASSWORD
openssl rand -base64 32
```

### 5.2 Crear `.env` para Producción
```bash
# Crear archivo .env
nano .env
```

### 5.3 Configurar `.env` para Producción
**⚠️ IMPORTANTE: Reemplaza `tudominio.com` con tu dominio real**

```bash
# ============================================================================
# BASE DE DATOS POSTGRESQL
# ============================================================================
DB_NAME=analizador_financiero
DB_USER=postgres
DB_PASSWORD=CONTRASEÑA_SUPER_SEGURA_GENERADA  # ⚠️ Usar contraseña generada
DB_SERVER=postgres
DB_PORT=5432
DATABASE_URL=postgresql://postgres:CONTRASEÑA_SUPER_SEGURA_GENERADA@postgres:5432/analizador_financiero

# ============================================================================
# BACKEND - SEGURIDAD
# ============================================================================
SECRET_KEY=SECRET_KEY_GENERADA_DE_32_CARACTERES  # ⚠️ Usar SECRET_KEY generada
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60

# ============================================================================
# BACKEND - CORS (⚠️ CAMBIAR A TU DOMINIO)
# ============================================================================
BACKEND_CORS_ORIGINS=https://tudominio.com,https://www.tudominio.com

# ============================================================================
# FRONTEND (⚠️ CAMBIAR A TU DOMINIO)
# ============================================================================
VITE_API_URL=https://tudominio.com/api/v1
VITE_APP_NAME=Analizador Financiero
VITE_ENV=production

# ============================================================================
# NGINX (⚠️ CAMBIAR A TU DOMINIO)
# ============================================================================
NGINX_HOST=tudominio.com
NGINX_PORT=80
NGINX_SSL_PORT=443

# ============================================================================
# DOCKER
# ============================================================================
DOCKER_IMAGE_TAG=latest
COMPOSE_PROJECT_NAME=analizador-financiero

# ============================================================================
# ADICIONAL
# ============================================================================
LOG_LEVEL=INFO
DEBUG_MODE=false
TZ=America/Argentina/Buenos_Aires
```

**Guarda el archivo:** `Ctrl + O`, Enter, `Ctrl + X`

---

## 📋 Paso 6: Configurar Nginx para SSL (Let's Encrypt)

### 6.1 Crear Directorio para SSL
```bash
# Crear directorio para certificados
mkdir -p nginx/ssl
```

### 6.2 Actualizar `nginx/nginx.conf` para Producción
```bash
# Editar configuración de Nginx
nano nginx/nginx.conf
```

**Reemplaza el contenido con esta configuración optimizada para SSL:**

```nginx
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    # Compresión Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Upstream para el backend
    upstream backend {
        server backend:8000;
    }

    # Upstream para el frontend
    upstream frontend {
        server frontend:80;
    }

    # Redirigir HTTP a HTTPS
    server {
        listen 80;
        server_name tudominio.com www.tudominio.com;  # ⚠️ CAMBIAR A TU DOMINIO

        # Permitir desafío de Let's Encrypt
        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        # Redirigir todo a HTTPS
        location / {
            return 301 https://$host$request_uri;
        }
    }

    # Servidor HTTPS
    server {
        listen 443 ssl http2;
        server_name tudominio.com www.tudominio.com;  # ⚠️ CAMBIAR A TU DOMINIO

        # Certificados SSL (Let's Encrypt)
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # Configuración SSL moderna
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # HSTS (opcional pero recomendado)
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # Proxy para el API backend
        location /api/ {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
            
            # WebSocket support
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }

        # Health check del backend
        location /health {
            proxy_pass http://backend/health;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Docs del API
        location /docs {
            proxy_pass http://backend/docs;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /redoc {
            proxy_pass http://backend/redoc;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /openapi.json {
            proxy_pass http://backend/openapi.json;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Proxy para el frontend (React SPA)
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Headers de seguridad
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
    }
}
```

**⚠️ IMPORTANTE:** Reemplaza `tudominio.com` con tu dominio real en TODO el archivo.

**Guarda el archivo:** `Ctrl + O`, Enter, `Ctrl + X`

---

## 📋 Paso 7: Levantar Aplicación SIN SSL (Temporal)

Primero levantamos la aplicación para que Let's Encrypt pueda verificar el dominio.

### 7.1 Construir y Levantar
```bash
# Construir imágenes
docker compose build

# Levantar servicios
docker compose up -d

# Ver logs
docker compose logs -f
```

### 7.2 Verificar que Funciona
```bash
# Desde el VPS
curl http://localhost/api/v1/health

# Desde tu máquina local (reemplaza IP_DEL_VPS)
curl http://IP_DEL_VPS/api/v1/health
```

---

## 📋 Paso 8: Instalar Certbot y Obtener Certificado SSL

### 8.1 Instalar Certbot
```bash
# Instalar Certbot y plugin de Nginx
sudo apt install -y certbot python3-certbot-nginx
```

### 8.2 Detener Nginx Temporalmente
```bash
# Detener solo el contenedor de Nginx
docker compose stop nginx
```

### 8.3 Obtener Certificado SSL
```bash
# Obtener certificado (reemplaza con tu dominio y email)
sudo certbot certonly --standalone \
  -d tudominio.com \
  -d www.tudominio.com \
  --email tu@email.com \
  --agree-tos \
  --no-eff-email \
  --staple-ocsp
```

**Salida esperada:**
```
Successfully received certificate.
Certificate is saved at: /etc/letsencrypt/live/tudominio.com/fullchain.pem
Key is saved at:         /etc/letsencrypt/live/tudominio.com/privkey.pem
```

### 8.4 Copiar Certificados a la Carpeta del Proyecto
```bash
# Crear directorio si no existe
mkdir -p nginx/ssl

# Copiar certificados
sudo cp /etc/letsencrypt/live/tudominio.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/tudominio.com/privkey.pem nginx/ssl/

# Dar permisos correctos
sudo chown -R $USER:$USER nginx/ssl
chmod 600 nginx/ssl/privkey.pem
chmod 644 nginx/ssl/fullchain.pem
```

---

## 📋 Paso 9: Reiniciar con SSL Habilitado

### 9.1 Reiniciar Nginx
```bash
# Reiniciar todos los servicios
docker compose down
docker compose up -d

# Ver logs de Nginx para verificar
docker compose logs nginx
```

### 9.2 Verificar SSL
```bash
# Desde el VPS
curl https://tudominio.com/api/v1/health

# Verificar certificado
openssl s_client -connect tudominio.com:443 -servername tudominio.com </dev/null 2>/dev/null | openssl x509 -noout -dates
```

### 9.3 Acceder desde el Navegador
```
https://tudominio.com
```

**Deberías ver:**
- ✅ Candado verde en el navegador
- ✅ Certificado válido de Let's Encrypt
- ✅ Frontend cargando correctamente

---

## 📋 Paso 10: Configurar Renovación Automática de SSL

### 10.1 Crear Script de Renovación
```bash
# Crear script
sudo nano /usr/local/bin/renew-ssl.sh
```

**Contenido del script:**
```bash
#!/bin/bash

# Renovar certificados
certbot renew --quiet

# Copiar certificados actualizados
cp /etc/letsencrypt/live/tudominio.com/fullchain.pem /home/$USER/Analizador-Financiero/03\ -\ Desarrollo/nginx/ssl/
cp /etc/letsencrypt/live/tudominio.com/privkey.pem /home/$USER/Analizador-Financiero/03\ -\ Desarrollo/nginx/ssl/

# Reiniciar Nginx
cd /home/$USER/Analizador-Financiero/03\ -\ Desarrollo
docker compose restart nginx

echo "SSL certificates renewed on $(date)" >> /var/log/ssl-renew.log
```

**Guarda el archivo:** `Ctrl + O`, Enter, `Ctrl + X`

### 10.2 Dar Permisos de Ejecución
```bash
sudo chmod +x /usr/local/bin/renew-ssl.sh
```

### 10.3 Configurar Cron Job
```bash
# Editar crontab
sudo crontab -e

# Agregar esta línea (renovar cada 60 días a las 3:00 AM)
0 3 */60 * * /usr/local/bin/renew-ssl.sh
```

### 10.4 Probar Renovación Manual
```bash
# Probar el script (no renovará si no es necesario)
sudo /usr/local/bin/renew-ssl.sh

# Ver log
cat /var/log/ssl-renew.log
```

---

## 📋 Paso 11: Configurar Backups Automáticos

### 11.1 Crear Script de Backup
```bash
# Crear directorio de backups
mkdir -p ~/backups

# Crear script
nano ~/backup-db.sh
```

**Contenido del script:**
```bash
#!/bin/bash

# Configuración
BACKUP_DIR="/home/$USER/backups"
DB_NAME="analizador_financiero"
DB_USER="postgres"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/analizador_backup_$TIMESTAMP.sql"
RETENTION_DAYS=7

# Crear backup
cd /home/$USER/Analizador-Financiero/03\ -\ Desarrollo
docker compose exec -T postgres pg_dump -U $DB_USER $DB_NAME > $BACKUP_FILE

# Comprimir
gzip $BACKUP_FILE

# Eliminar backups antiguos
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completado: $BACKUP_FILE.gz" >> /var/log/db-backup.log
```

**Guarda el archivo:** `Ctrl + O`, Enter, `Ctrl + X`

### 11.2 Dar Permisos
```bash
chmod +x ~/backup-db.sh
```

### 11.3 Configurar Cron para Backups Diarios
```bash
# Editar crontab
crontab -e

# Agregar esta línea (backup diario a las 2:00 AM)
0 2 * * * /home/$USER/backup-db.sh
```

### 11.4 Probar Backup Manual
```bash
# Ejecutar backup
~/backup-db.sh

# Verificar que se creó
ls -lh ~/backups/

# Ver log
cat /var/log/db-backup.log
```

---

## 📋 Paso 12: Optimizaciones Finales de Producción

### 12.1 Configurar Swap (Recomendado para VPS con poca RAM)
```bash
# Crear archivo swap de 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Hacer permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Verificar
free -h
```

### 12.2 Configurar Log Rotation
```bash
# Crear configuración para Docker logs
sudo nano /etc/logrotate.d/docker-containers
```

**Contenido:**
```
/var/lib/docker/containers/*/*.log {
    rotate 7
    daily
    compress
    missingok
    delaycompress
    copytruncate
}
```

### 12.3 Limitar Uso de Recursos de Docker (Opcional)
Editar `docker-compose.yml`:
```yaml
services:
  backend:
    # ... configuración existente ...
    deploy:
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M
```

---

# PARTE 3: Comandos Útiles

## 🛠️ Gestión de Servicios

### Ver Logs
```bash
# Todos los servicios
docker compose logs -f

# Servicio específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
docker compose logs -f nginx

# Últimas N líneas
docker compose logs --tail=100 backend
```

### Reiniciar Servicios
```bash
# Reiniciar un servicio
docker compose restart backend

# Reiniciar todo
docker compose restart

# Detener todo
docker compose down

# Detener y eliminar volúmenes (⚠️ pierdes datos)
docker compose down -v
```

### Reconstruir Después de Cambios
```bash
# Backend
docker compose up -d --build backend

# Frontend
docker compose up -d --build frontend

# Todo
docker compose down
docker compose build
docker compose up -d
```

---

## 🗄️ Gestión de Base de Datos

### Conectarse a PostgreSQL
```bash
# Entrar a psql
docker exec -it analizador-postgres psql -U postgres -d analizador_financiero

# Comandos dentro de psql:
\dt              # Listar tablas
\d usuarios      # Ver estructura de tabla
\q               # Salir
```

### Ejecutar Consultas
```bash
# Desde línea de comandos
docker exec -it analizador-postgres psql -U postgres -d analizador_financiero -c "SELECT COUNT(*) FROM usuarios;"
```

### Backup Manual
```bash
# Crear backup
docker exec analizador-postgres pg_dump -U postgres analizador_financiero > backup_$(date +%Y%m%d).sql

# Comprimir
gzip backup_*.sql
```

### Restaurar Backup
```bash
# Descomprimir
gunzip backup_20250101.sql.gz

# Restaurar
docker exec -i analizador-postgres psql -U postgres analizador_financiero < backup_20250101.sql
```

---

## 📊 Monitoreo

### Ver Estado de Contenedores
```bash
# Estado general
docker compose ps

# Con formato bonito
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Ver Uso de Recursos
```bash
# En tiempo real
docker stats

# Solo un contenedor
docker stats analizador-backend
```

### Verificar Salud del Sistema
```bash
# Espacio en disco
df -h
docker system df

# Memoria
free -h

# CPU y procesos
htop
```

---

## 🧹 Limpieza

### Limpiar Docker
```bash
# Contenedores detenidos
docker container prune -f

# Imágenes sin usar
docker image prune -a -f

# Volúmenes sin usar
docker volume prune -f

# Todo (⚠️ cuidado)
docker system prune -a --volumes -f
```

### Limpiar Logs
```bash
# Ver tamaño de logs
sudo du -sh /var/lib/docker/containers/*/*-json.log

# Limpiar logs de un contenedor
sudo truncate -s 0 /var/lib/docker/containers/CONTAINER_ID/*-json.log
```

---

# PARTE 4: Troubleshooting

## ❌ Problemas Comunes

### Puerto 80/443 en uso
```bash
# Ver qué proceso usa el puerto
sudo lsof -i :80
sudo netstat -tulpn | grep :80

# Detener Apache si existe
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Error de permisos
```bash
# Verificar grupo docker
groups

# Agregar usuario al grupo
sudo usermod -aG docker $USER
newgrp docker
```

### Base de datos no se conecta
```bash
# Ver logs de PostgreSQL
docker compose logs postgres

# Verificar conectividad
docker exec -it analizador-backend ping postgres

# Verificar variables de entorno
docker exec analizador-backend env | grep DB_
```

### SSL no funciona
```bash
# Verificar certificados
ls -la nginx/ssl/

# Ver logs de Nginx
docker compose logs nginx

# Verificar configuración
docker exec analizador-nginx nginx -t

# Renovar certificados manualmente
sudo certbot renew --force-renewal
sudo /usr/local/bin/renew-ssl.sh
```

### Frontend no carga
```bash
# Ver logs
docker compose logs frontend

# Reconstruir
docker compose up -d --build frontend

# Verificar variables de entorno
cat .env | grep VITE
```

---

## 🔍 Debugging Avanzado

### Entrar a un Contenedor
```bash
# Backend
docker exec -it analizador-backend bash

# Frontend
docker exec -it analizador-frontend sh

# PostgreSQL
docker exec -it analizador-postgres bash
```

### Ver Variables de Entorno
```bash
# En un contenedor
docker exec analizador-backend env

# En archivo .env
cat .env
```

### Verificar Red Docker
```bash
# Ver redes
docker network ls

# Inspeccionar red
docker network inspect analizador-network

# Probar conectividad entre contenedores
docker exec analizador-backend ping postgres
docker exec analizador-backend ping frontend
```

---

# PARTE 5: Mantenimiento y Monitoreo

## 📈 Monitoreo Continuo

### Script de Monitoreo
```bash
# Crear script
cat > ~/monitor.sh << 'EOF'
#!/bin/bash
while true; do
    clear
    echo "=== Estado de Contenedores ==="
    docker compose ps
    echo -e "\n=== Uso de Recursos ==="
    docker stats --no-stream
    echo -e "\n=== Espacio en Disco ==="
    df -h | grep -E '/$|/var'
    echo -e "\n=== Última actualización: $(date) ==="
    sleep 5
done
EOF

chmod +x ~/monitor.sh

# Ejecutar
~/monitor.sh
```

---

## 🔄 Actualizar la Aplicación

### Actualizar desde Git
```bash
# Ir al directorio del proyecto
cd ~/Analizador-Financiero/03\ -\ Desarrollo

# Detener servicios
docker compose down

# Obtener últimos cambios
git pull origin main

# Reconstruir
docker compose build

# Levantar
docker compose up -d

# Verificar logs
docker compose logs -f
```

---

## ✅ Checklist Post-Deployment

- [ ] Docker y Docker Compose instalados
- [ ] Firewall configurado (puertos 22, 80, 443)
- [ ] Archivo `.env` con valores de producción
- [ ] Dominio apuntando a IP del VPS
- [ ] SSL configurado con Let's Encrypt
- [ ] Certificados SSL copiados a `nginx/ssl/`
- [ ] Aplicación accesible en https://tudominio.com
- [ ] Backend respondiendo en https://tudominio.com/api/v1/health
- [ ] Renovación automática de SSL configurada (cron)
- [ ] Backups automáticos configurados (cron)
- [ ] CORS configurado con dominio específico
- [ ] No hay errores en logs (`docker compose logs`)
- [ ] Swap configurado (si RAM < 4GB)
- [ ] Log rotation configurado

---

## 🎯 URLs de Verificación Final

| Servicio | URL | Estado Esperado |
|----------|-----|-----------------|
| Frontend | https://tudominio.com | ✅ 200 OK |
| Backend Health | https://tudominio.com/api/v1/health | ✅ {"status": "healthy"} |
| API Docs | https://tudominio.com/docs | ✅ Swagger UI |
| ReDoc | https://tudominio.com/redoc | ✅ ReDoc UI |
| SSL Certificate | https://www.ssllabs.com/ssltest/ | ✅ A+ Rating |

---

## 📞 Soporte

Si encuentras problemas:

1. **Revisa los logs:** `docker compose logs -f`
2. **Verifica el estado:** `docker compose ps`
3. **Verifica la red:** `docker network inspect analizador-network`
4. **Verifica SSL:** `openssl s_client -connect tudominio.com:443`
5. **Consulta esta guía** para comandos específicos

---

**Fecha de creación:** Octubre 2025  
**Autor:** Deployment Guide - Analizador Financiero  
**Versión:** 1.0
