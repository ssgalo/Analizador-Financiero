# 🚀 Dockerización del Analizador Financiero - Resumen

## ✅ Archivos Creados

### 📁 Estructura del Proyecto

```
03 - Desarrollo/
├── 📄 docker-compose.yml              # Orquestación de todos los servicios
├── 📄 .env.example                    # Plantilla de variables de entorno
├── 📄 .gitignore                      # Archivos a ignorar en git
├── 📄 README.md                       # Documentación principal
├── 📄 deploy.sh                       # Script de deployment (Linux/Mac)
├── 📄 deploy.ps1                      # Script de deployment (Windows)
├── 📄 MIGRATION_GUIDE.md              # Guía de migración SQL Server → PostgreSQL
├── 📄 VPS_DEPLOYMENT_GUIDE.md         # Guía completa de deployment en VPS
│
├── 📂 backend/
│   ├── 📄 Dockerfile                  # Imagen Docker para FastAPI
│   ├── 📄 .dockerignore              # Archivos a ignorar en build
│   ├── 📄 requirements.txt           # ✏️ Actualizado para PostgreSQL (psycopg2-binary)
│   └── 📂 app/
│       ├── 📂 core/
│       │   └── 📄 config.py          # ✏️ Actualizado con soporte PostgreSQL
│       └── 📂 crud/
│           └── 📄 session.py         # ✏️ Actualizado para conexión PostgreSQL
│
├── 📂 analizador-gastos-front/
│   ├── 📄 Dockerfile                  # Multi-stage build con Nginx
│   ├── 📄 nginx.conf                  # Configuración de Nginx para SPA
│   ├── 📄 .dockerignore              # Archivos a ignorar en build
│   ├── 📄 .env.production            # Variables de entorno para producción
│   └── 📄 .env.development           # Variables de entorno para desarrollo
│
├── 📂 nginx/
│   └── 📄 nginx.conf                  # Reverse proxy principal
│
└── 📂 database/
    └── 📄 init.sql                    # Script de inicialización PostgreSQL
```

## 🏗️ Arquitectura de Deployment

```
Internet
    ↓
┌─────────────────────────────────────┐
│  Nginx Reverse Proxy (Puerto 80)   │
│  - Manejo de HTTP/HTTPS             │
│  - Compresión gzip                  │
│  - Headers de seguridad             │
└─────────────────────────────────────┘
         ↓                    ↓
    ┌────────┐          ┌──────────┐
    │Frontend│          │ Backend  │
    │React+  │          │ FastAPI  │
    │Nginx   │          │ Python   │
    │:80     │          │ :8000    │
    └────────┘          └──────────┘
                             ↓
                    ┌─────────────────┐
                    │   PostgreSQL    │
                    │   Database      │
                    │   :5432         │
                    └─────────────────┘
                             ↓
                    ┌─────────────────┐
                    │  Volume         │
                    │  postgres_data  │
                    └─────────────────┘
```

## 📋 Pasos para Deployar

### 1️⃣ Configuración Inicial

```bash
# Copiar variables de entorno
cp .env.example .env

# Editar con tus valores
nano .env
```

**Variables críticas a configurar:**
- `DB_PASSWORD`: Contraseña segura para PostgreSQL
- `SECRET_KEY`: Clave secreta para JWT (mínimo 32 caracteres)

### 2️⃣ Migrar Base de Datos

Ver `MIGRATION_GUIDE.md` para instrucciones detalladas de migración desde SQL Server.

Opciones:
- **pgloader** (recomendado)
- Exportación/Importación manual CSV
- Script Python personalizado

### 3️⃣ Construir y Ejecutar

**En Linux/Mac:**
```bash
chmod +x deploy.sh
./deploy.sh
```

**En Windows (PowerShell):**
```powershell
.\deploy.ps1
```

**Manualmente:**
```bash
docker-compose build
docker-compose up -d
```

### 4️⃣ Verificar Deployment

```bash
# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f

# Verificar salud
curl http://localhost/health
```

## 🌐 URLs de Acceso

| Servicio | URL Local | URL Producción |
|----------|-----------|----------------|
| Frontend | http://localhost | http://tu-dominio.com |
| Backend API | http://localhost/api/v1 | http://tu-dominio.com/api/v1 |
| API Docs | http://localhost/docs | http://tu-dominio.com/docs |
| Health Check | http://localhost/health | http://tu-dominio.com/health |

## 🔧 Comandos Útiles

```bash
# Ver logs de un servicio
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Reiniciar un servicio
docker-compose restart backend

# Reconstruir después de cambios
docker-compose down
docker-compose build
docker-compose up -d

# Acceder a la base de datos
docker-compose exec postgres psql -U postgres -d analizador_financiero

# Backup de base de datos
docker-compose exec postgres pg_dump -U postgres analizador_financiero > backup.sql

# Restore de base de datos
docker-compose exec -T postgres psql -U postgres analizador_financiero < backup.sql

# Ver uso de recursos
docker stats

# Limpiar sistema
docker system prune -a
```

## 🔒 Configuración de Seguridad (Producción)

### ✅ Antes de Deployar en VPS:

1. **Cambiar SECRET_KEY**
   ```bash
   openssl rand -hex 32
   ```

2. **Configurar CORS en backend**
   Editar `backend/app/main.py`:
   ```python
   allow_origins=["https://tu-dominio.com"]
   ```

3. **Configurar SSL/HTTPS**
   - Usar Let's Encrypt con Certbot
   - Ver `VPS_DEPLOYMENT_GUIDE.md`

4. **Configurar Firewall (UFW)**
   ```bash
   sudo ufw allow 22/tcp
   sudo ufw allow 80/tcp
   sudo ufw allow 443/tcp
   sudo ufw enable
   ```

5. **Backups Automáticos**
   - Configurar cron job para backups diarios
   - Ver script en `VPS_DEPLOYMENT_GUIDE.md`

## 📊 Monitoreo

```bash
# Logs en tiempo real
docker-compose logs -f --tail=100

# Estado de servicios
docker-compose ps

# Uso de recursos
docker stats

# Espacio en disco
docker system df -v
```

## 🆘 Troubleshooting

### Backend no conecta a PostgreSQL
```bash
# Verificar que postgres esté corriendo
docker-compose ps postgres

# Ver logs de postgres
docker-compose logs postgres

# Verificar variables de entorno
docker-compose exec backend env | grep DB_
```

### Frontend no carga
```bash
# Verificar build
docker-compose logs frontend

# Reconstruir frontend
docker-compose build --no-cache frontend
docker-compose up -d frontend
```

### Error de CORS
- Verificar `allow_origins` en `backend/app/main.py`
- En desarrollo: `allow_origins=["*"]`
- En producción: `allow_origins=["https://tu-dominio.com"]`

## 📚 Documentación Adicional

- **README.md**: Documentación general
- **VPS_DEPLOYMENT_GUIDE.md**: Guía completa de deployment en VPS
  - Instalación de Docker
  - Configuración de firewall
  - SSL con Let's Encrypt
  - Backups automáticos
  - Optimizaciones de producción
- **MIGRATION_GUIDE.md**: Migración de SQL Server a PostgreSQL
  - Uso de pgloader
  - Exportación/Importación manual
  - Scripts de migración
  - Diferencias SQL Server vs PostgreSQL

## ✨ Características Implementadas

- ✅ Multi-stage builds para optimizar tamaño de imágenes
- ✅ Reverse proxy con Nginx
- ✅ Health checks para todos los servicios
- ✅ Persistencia de datos con volumes
- ✅ Variables de entorno centralizadas
- ✅ Compresión gzip
- ✅ Headers de seguridad
- ✅ Soporte para SSL/HTTPS
- ✅ Configuración SPA para React Router
- ✅ Logs centralizados
- ✅ Restart automático de servicios

## 🚀 Próximos Pasos

1. **Configurar .env** con tus valores
2. **Migrar base de datos** de SQL Server a PostgreSQL
3. **Probar localmente** con `docker-compose up -d`
4. **Deployar en VPS** siguiendo `VPS_DEPLOYMENT_GUIDE.md`
5. **Configurar SSL** con Let's Encrypt
6. **Configurar backups** automáticos
7. **Monitorear** logs y recursos

## 📝 Notas Importantes

- El frontend usa **VITE_API_BASE_URL=/api** en producción (relativo)
- El backend usa **psycopg2-binary** para PostgreSQL
- Los datos persisten en el volume **postgres_data**
- El puerto 80 se expone para HTTP (443 para HTTPS si configuras SSL)
- Todos los servicios están en la red **analizador-network**

## 🎯 Checklist de Deployment

- [ ] Archivo `.env` configurado con valores seguros
- [ ] Base de datos migrada de SQL Server a PostgreSQL
- [ ] Variables de entorno verificadas
- [ ] Docker y Docker Compose instalados en VPS
- [ ] Firewall configurado (UFW)
- [ ] SSL configurado (Let's Encrypt)
- [ ] CORS actualizado con dominio específico
- [ ] Backups automáticos configurados
- [ ] Aplicación accesible desde navegador
- [ ] API respondiendo en `/health`
- [ ] Frontend cargando correctamente
- [ ] Autenticación funcionando
- [ ] Base de datos con datos migrados

¡Tu aplicación está lista para producción! 🎉
