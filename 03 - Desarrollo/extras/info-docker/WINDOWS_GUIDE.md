# 🪟 Guía para Windows - Analizador Financiero Docker

Esta guía está específicamente diseñada para deployment en Windows.

## 📋 Requisitos Previos en Windows

### 1. Docker Desktop para Windows

**Descarga e instala:**
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)

**Requisitos:**
- Windows 10/11 64-bit: Pro, Enterprise, o Education
- WSL 2 habilitado
- Virtualización habilitada en BIOS

**Verificar instalación:**
```powershell
docker --version
docker-compose --version
```

### 2. WSL 2 (Windows Subsystem for Linux)

**Habilitar WSL 2:**
```powershell
# Ejecutar como Administrador
wsl --install
wsl --set-default-version 2

# Instalar Ubuntu
wsl --install -d Ubuntu
```

**Verificar:**
```powershell
wsl --list --verbose
```

### 3. Git para Windows

**Descarga:**
- [Git for Windows](https://git-scm.com/download/win)

**Verificar:**
```powershell
git --version
```

## 🚀 Setup Inicial en Windows

### Paso 1: Clonar el Repositorio

```powershell
# Navegar a donde quieres el proyecto
cd C:\Users\TuUsuario\Desktop

# Clonar
git clone https://github.com/TU_USUARIO/Analizador-Financiero.git
cd Analizador-Financiero\"03 - Desarrollo"
```

### Paso 2: Configurar Variables de Entorno

```powershell
# Copiar archivo de ejemplo
Copy-Item .env.example .env

# Editar con Notepad
notepad .env
```

**Valores a cambiar:**
- `DB_PASSWORD`: Contraseña segura para PostgreSQL
- `SECRET_KEY`: Generar con este comando:

```powershell
# Generar SECRET_KEY
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)
```

### Paso 3: Verificar Configuración

```powershell
# Ejecutar script de verificación
.\verify.ps1
```

### Paso 4: Deployment

```powershell
# Ejecutar script de deployment
.\deploy.ps1
```

O manualmente:

```powershell
# Construir imágenes
docker-compose build

# Iniciar servicios
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## 🔧 Comandos PowerShell para Docker

### Gestión de Servicios

```powershell
# Ver estado
docker-compose ps

# Ver logs
docker-compose logs -f
docker-compose logs -f backend
docker-compose logs -f frontend

# Reiniciar servicios
docker-compose restart
docker-compose restart backend

# Detener todo
docker-compose down

# Detener y limpiar volúmenes (¡CUIDADO!)
docker-compose down -v
```

### Base de Datos

```powershell
# Conectarse a PostgreSQL
docker-compose exec postgres psql -U postgres -d analizador_financiero

# Backup
docker-compose exec postgres pg_dump -U postgres analizador_financiero > backup_$(Get-Date -Format "yyyyMMdd_HHmmss").sql

# Restore
Get-Content backup.sql | docker-compose exec -T postgres psql -U postgres -d analizador_financiero
```

### Debugging

```powershell
# Acceder al shell del backend
docker-compose exec backend sh

# Ver variables de entorno
docker-compose exec backend env

# Ver uso de recursos
docker stats

# Limpiar sistema Docker
docker system prune -a
```

## 🌐 Acceder a la Aplicación

Una vez que todo esté corriendo:

- **Frontend**: http://localhost
- **Backend API**: http://localhost/api/v1
- **API Docs**: http://localhost/docs
- **Health Check**: http://localhost/health

## 🐛 Troubleshooting en Windows

### Error: "docker-compose no se reconoce..."

**Solución:**
- Asegúrate de que Docker Desktop esté corriendo
- Reinicia PowerShell
- Verifica que Docker Desktop incluye Compose v2

### Error: "Port 80 is already in use"

**Verificar qué usa el puerto 80:**
```powershell
Get-NetTCPConnection -LocalPort 80 | Select-Object -Property OwningProcess, State

# Ver proceso
Get-Process -Id <ID_PROCESO>
```

**Soluciones:**
- Detener IIS si está corriendo:
  ```powershell
  Stop-Service -Name W3SVC
  ```
- O cambiar puerto en `docker-compose.yml`:
  ```yaml
  nginx:
    ports:
      - "8080:80"  # En vez de 80:80
  ```

### Error: WSL 2 Installation Failed

**Solución:**
```powershell
# Ejecutar como Administrador
dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart

# Reiniciar PC
# Descargar e instalar el kernel de WSL2
# https://aka.ms/wsl2kernel
```

### Error: "Access Denied" al ejecutar scripts

**Solución:**
```powershell
# Cambiar política de ejecución (Ejecutar como Administrador)
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser

# Verificar
Get-ExecutionPolicy
```

### Docker Desktop no inicia

**Soluciones:**
1. Verificar que la virtualización esté habilitada en BIOS
2. Actualizar Docker Desktop a la última versión
3. Reiniciar servicio Docker:
   ```powershell
   Restart-Service -Name com.docker.service
   ```

### Error: "Drive sharing" en Docker Desktop

**Solución:**
- Abrir Docker Desktop
- Settings → Resources → File Sharing
- Agregar la unidad C:\ o donde esté tu proyecto
- Apply & Restart

## 📦 Deployment en VPS desde Windows

### Opción 1: Usar WSL 2

```powershell
# Abrir WSL
wsl

# Ahora estás en Linux, puedes usar comandos Linux
cd /mnt/c/Users/TuUsuario/Desktop/Analizador-Financiero/03\ -\ Desarrollo/
./deploy.sh
```

### Opción 2: Usar PowerShell con SSH

```powershell
# Conectarse a VPS
ssh usuario@ip-del-vps

# Una vez conectado, seguir VPS_DEPLOYMENT_GUIDE.md
```

### Opción 3: Usar Visual Studio Code Remote SSH

1. Instalar extensión "Remote - SSH" en VS Code
2. Conectarse a VPS
3. Abrir terminal en VS Code
4. Ejecutar comandos normalmente

## 🔐 Generar Claves Seguras en Windows

### SECRET_KEY para JWT

```powershell
# Método 1: PowerShell nativo
$bytes = New-Object byte[] 32
[Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
[Convert]::ToBase64String($bytes)

# Método 2: Usando OpenSSL (si está instalado)
openssl rand -hex 32
```

### Contraseña de Base de Datos

```powershell
# Generar contraseña aleatoria
$password = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 16 | ForEach-Object {[char]$_})
Write-Output $password
```

## 📊 Monitoreo en Windows

### Ver logs en tiempo real

```powershell
# Opción 1: PowerShell
docker-compose logs -f

# Opción 2: Docker Desktop GUI
# Abrir Docker Desktop → Containers → Click en tu contenedor
```

### Ver recursos

```powershell
# Uso de recursos
docker stats

# Espacio en disco
docker system df -v
```

## 🔄 Actualizar Aplicación

```powershell
# Ir al directorio del proyecto
cd "C:\Users\TuUsuario\Desktop\Analizador-Financiero\03 - Desarrollo"

# Obtener últimos cambios
git pull origin main

# Reconstruir
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Ver logs
docker-compose logs -f
```

## 📝 Comandos Útiles PowerShell

```powershell
# Ver versión de Docker
docker --version
docker-compose --version

# Ver contenedores corriendo
docker ps

# Ver todas las imágenes
docker images

# Limpiar todo (¡CUIDADO!)
docker system prune -a --volumes

# Ver redes
docker network ls

# Ver volúmenes
docker volume ls

# Inspeccionar volumen
docker volume inspect postgres_data
```

## 🎯 Tips para Windows

1. **Usar PowerShell 7** (mejor que PowerShell 5.1)
   ```powershell
   winget install Microsoft.PowerShell
   ```

2. **Windows Terminal** (mejor experiencia)
   ```powershell
   winget install Microsoft.WindowsTerminal
   ```

3. **Docker Desktop debe estar corriendo** siempre
   - Configurar para iniciar con Windows
   - Settings → General → "Start Docker Desktop when you log in"

4. **Paths con espacios**
   ```powershell
   # Usar comillas
   cd "C:\Users\Tu Usuario\Desktop\Proyecto"
   
   # O escapar espacios (en WSL)
   cd /mnt/c/Users/Tu\ Usuario/Desktop/Proyecto
   ```

5. **Line endings** (importante para scripts)
   ```powershell
   # Configurar Git para Windows
   git config --global core.autocrlf true
   ```

## ✅ Checklist para Windows

- [ ] Docker Desktop instalado y corriendo
- [ ] WSL 2 habilitado e instalado
- [ ] Git para Windows instalado
- [ ] Política de ejecución configurada
- [ ] Variables de entorno configuradas en `.env`
- [ ] Puerto 80 disponible (o IIS detenido)
- [ ] Docker Desktop compartiendo unidades necesarias
- [ ] Script de verificación ejecutado sin errores
- [ ] Aplicación deployada correctamente
- [ ] Puedo acceder a http://localhost

## 🆘 Soporte

Si tienes problemas en Windows:

1. Verifica logs de Docker Desktop
2. Revisa eventos de Windows (Event Viewer)
3. Ejecuta `verify.ps1` para diagnóstico
4. Revisa la sección Troubleshooting arriba

---

**¡Listo para empezar!** Ejecuta `.\verify.ps1` para verificar tu setup.
