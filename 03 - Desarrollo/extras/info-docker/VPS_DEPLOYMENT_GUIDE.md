# Guía de Deployment en VPS

Esta guía te ayudará a deployar el Analizador Financiero en tu VPS.

## 📋 Requisitos del VPS

- **Sistema Operativo**: Ubuntu 20.04 LTS o superior (recomendado)
- **RAM**: Mínimo 2GB (4GB recomendado)
- **Disco**: Mínimo 20GB libres
- **CPU**: 2 vCPUs
- **Acceso**: SSH con permisos sudo

## 🔧 Preparación del VPS

### 1. Actualizar el sistema

```bash
sudo apt-get update
sudo apt-get upgrade -y
```

### 2. Instalar Docker

```bash
# Instalar dependencias
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

# Agregar la clave GPG oficial de Docker
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Configurar el repositorio
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Instalar Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Agregar tu usuario al grupo docker
sudo usermod -aG docker $USER

# Aplicar cambios (o cerrar sesión y volver a entrar)
newgrp docker
```

### 3. Instalar Docker Compose

```bash
# Descargar Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# Dar permisos de ejecución
sudo chmod +x /usr/local/bin/docker-compose

# Verificar instalación
docker-compose --version
```

### 4. Configurar Firewall (UFW)

```bash
# Instalar UFW si no está instalado
sudo apt-get install -y ufw

# Configurar reglas básicas
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir SSH (¡IMPORTANTE! No te bloquees)
sudo ufw allow ssh
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Habilitar firewall
sudo ufw enable

# Verificar estado
sudo ufw status
```

## 📦 Deployment de la Aplicación

### 1. Clonar el repositorio

```bash
# Instalar git si no está instalado
sudo apt-get install -y git

# Clonar el repositorio
git clone https://github.com/TU_USUARIO/Analizador-Financiero.git
cd Analizador-Financiero/03\ -\ Desarrollo
```

### 2. Configurar variables de entorno

```bash
# Copiar archivo de ejemplo
cp .env.example .env

# Editar con nano o vim
nano .env
```

Configuración recomendada para producción:

```env
# Base de datos PostgreSQL
DB_NAME=analizador_financiero
DB_USER=postgres
DB_PASSWORD=GENERA_UNA_CONTRASEÑA_SEGURA_AQUÍ

# JWT Secret Key (GENERAR UNA NUEVA)
SECRET_KEY=GENERA_UNA_CLAVE_SECRETA_MUY_LARGA_Y_ALEATORIA_DE_AL_MENOS_32_CARACTERES

# Tiempo de expiración del token (en minutos)
ACCESS_TOKEN_EXPIRE_MINUTES=60

# Entorno
ENVIRONMENT=production
```

**Generar claves seguras:**

```bash
# Para SECRET_KEY
openssl rand -hex 32

# Para DB_PASSWORD
openssl rand -base64 32
```

### 3. Ejecutar deployment

```bash
# Dar permisos de ejecución al script
chmod +x deploy.sh

# Ejecutar deployment
./deploy.sh
```

O manualmente:

```bash
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

### 4. Verificar que todo funciona

```bash
# Ver estado de contenedores
docker-compose ps

# Verificar salud del backend
curl http://localhost/health

# Ver logs en tiempo real
docker-compose logs -f backend
docker-compose logs -f frontend
```

## 🌐 Configurar Dominio (Opcional)

### 1. Apuntar dominio a tu VPS

En tu proveedor de DNS (Namecheap, GoDaddy, Cloudflare, etc.):

- Tipo: `A`
- Nombre: `@` (o `www`)
- Valor: `IP_DE_TU_VPS`
- TTL: `3600`

### 2. Instalar Certbot para SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt-get install -y certbot

# Detener nginx temporalmente
docker-compose stop nginx

# Generar certificados
sudo certbot certonly --standalone -d tudominio.com -d www.tudominio.com

# Copiar certificados a la carpeta del proyecto
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/tudominio.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/tudominio.com/privkey.pem nginx/ssl/key.pem
sudo chown -R $USER:$USER nginx/ssl
```

### 3. Actualizar configuración de Nginx

Edita `nginx/nginx.conf` y descomenta las líneas de SSL:

```nginx
listen 443 ssl http2;
ssl_certificate /etc/nginx/ssl/cert.pem;
ssl_certificate_key /etc/nginx/ssl/key.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers HIGH:!aNULL:!MD5;
```

Reinicia nginx:

```bash
docker-compose restart nginx
```

### 4. Renovación automática de certificados

```bash
# Crear un cron job para renovación
sudo crontab -e

# Agregar esta línea (renovar cada 60 días a las 3am)
0 3 */60 * * certbot renew --quiet && cp /etc/letsencrypt/live/tudominio.com/*.pem /home/tu_usuario/Analizador-Financiero/03\ -\ Desarrollo/nginx/ssl/ && docker-compose restart nginx
```

## 🔒 Seguridad Adicional

### 1. Configurar CORS correctamente

Edita `backend/app/main.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://tudominio.com"],  # Tu dominio específico
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 2. Cambiar puerto SSH (Opcional pero recomendado)

```bash
sudo nano /etc/ssh/sshd_config
# Cambiar Port 22 por Port 2222
sudo systemctl restart sshd
sudo ufw allow 2222/tcp
```

### 3. Fail2ban para protección contra fuerza bruta

```bash
sudo apt-get install -y fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

## 📊 Monitoreo y Mantenimiento

### Logs de aplicación

```bash
# Ver todos los logs
docker-compose logs -f

# Ver logs específicos
docker-compose logs -f backend
docker-compose logs -f postgres

# Ver últimas 100 líneas
docker-compose logs --tail=100
```

### Monitoreo de recursos

```bash
# Ver uso de recursos de contenedores
docker stats

# Ver espacio en disco
df -h
docker system df
```

### Backup de base de datos

Crea un script `backup.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/home/$USER/backups"
mkdir -p $BACKUP_DIR

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/analizador_backup_$TIMESTAMP.sql"

docker-compose exec -T postgres pg_dump -U postgres analizador_financiero > $BACKUP_FILE

# Comprimir
gzip $BACKUP_FILE

# Eliminar backups antiguos (más de 7 días)
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup creado: $BACKUP_FILE.gz"
```

Automatizar con cron:

```bash
chmod +x backup.sh
crontab -e

# Backup diario a las 2am
0 2 * * * /home/$USER/Analizador-Financiero/03\ -\ Desarrollo/backup.sh
```

### Actualizar la aplicación

```bash
# Ir al directorio del proyecto
cd ~/Analizador-Financiero/03\ -\ Desarrollo

# Obtener últimos cambios
git pull origin main

# Reconstruir y reiniciar
docker-compose down
docker-compose build
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

## 🆘 Troubleshooting

### Contenedor no inicia

```bash
# Ver logs detallados
docker-compose logs <nombre_servicio>

# Reiniciar servicio específico
docker-compose restart <nombre_servicio>

# Reconstruir servicio
docker-compose up -d --build <nombre_servicio>
```

### Problemas de conexión a base de datos

```bash
# Verificar que PostgreSQL está corriendo
docker-compose ps postgres

# Conectarse manualmente
docker-compose exec postgres psql -U postgres -d analizador_financiero

# Verificar variables de entorno
docker-compose exec backend env | grep DB_
```

### Puerto 80 ya está en uso

```bash
# Ver qué está usando el puerto
sudo lsof -i :80

# Detener Apache si está instalado
sudo systemctl stop apache2
sudo systemctl disable apache2
```

### Limpiar Docker

```bash
# Eliminar contenedores detenidos
docker container prune

# Eliminar imágenes sin usar
docker image prune

# Limpieza completa (¡CUIDADO!)
docker system prune -a
```

## 📈 Optimizaciones

### Habilitar compresión Brotli en Nginx

```bash
# Ya está configurada la compresión gzip en nginx.conf
# Para mejor compresión, puedes usar módulos adicionales
```

### Configurar swap (si tienes poca RAM)

```bash
# Crear archivo swap de 2GB
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Hacer permanente
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

## ✅ Checklist final

- [ ] Docker y Docker Compose instalados
- [ ] Firewall configurado (UFW)
- [ ] Variables de entorno configuradas (.env)
- [ ] Certificados SSL configurados (si usas dominio)
- [ ] CORS actualizado con dominio específico
- [ ] Backups automáticos configurados
- [ ] Monitoreo de logs activo
- [ ] Aplicación accesible desde navegador
- [ ] API respondiendo correctamente (/health)
- [ ] Base de datos con datos migrados

¡Tu aplicación debería estar corriendo en producción!
