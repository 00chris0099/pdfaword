# Guía de Deployment en EasyPanel

## Requisitos previos

- VPS Ubuntu 22.04+ con **4GB RAM mínimo** (recomendado 8GB para OCR)
- EasyPanel instalado y funcionando
- Un dominio o subdominio (ej: `pdfforge.tudominio.com`)
- Repositorio en GitHub con el código

---

## Paso 1: Preparar el repositorio en GitHub

### 1.1 Crear repositorio en GitHub

1. Ve a [github.com/new](https://github.com/new)
2. Nombre: `pdfforge`
3. **Público** o Privado (tu elección)
4. No inicializar con README (ya tenemos uno)
5. Click en **Create repository**

### 1.2 Subir el código

Desde tu computadora, en la carpeta del proyecto:

```bash
cd "C:\Users\chris\Downloads\PDF A"

# Inicializar git
git init
git add .
git commit -m "Initial commit: PDFForge complete"

# Conectar con tu repositorio (reemplaza TU_USUARIO)
git remote add origin https://github.com/TU_USUARIO/pdfforge.git
git branch -M main
git push -u origin main
```

---

## Paso 2: Configurar tu VPS

### 2.1 SSH a tu VPS

```bash
ssh root@TU_IP_DEL_VPS
```

### 2.2 Instalar EasyPanel (si no lo tienes)

```bash
curl -sSL https://get.easypanel.io | sh
```

### 2.3 Acceder a EasyPanel

Abre en tu navegador:
```
http://TU_IP_DEL_VPS:8096
```

Crea tu cuenta de administrador en el wizard inicial.

---

## Paso 3: Crear el proyecto en EasyPanel

### 3.1 Crear proyecto

1. En el dashboard, click en **Projects**
2. Click **New Project**
3. Nombre: `pdfforge`
4. Click **Create**

### 3.2 Crear servicio Compose

1. Dentro del proyecto, click **New Service**
2. Selecciona **Compose** (no App)
3. Nombre: `pdfforge`
4. Click **Create**

---

## Paso 4: Configurar el código fuente

### 4.1 Conectar el repositorio

1. Ve a la pestaña **Source**
2. En **Git Repository** pega:
   ```
   https://github.com/TU_USUARIO/pdfforge.git
   ```
3. Branch: `main`
4. Root Path: `/`
5. Compose File: `docker-compose.yml`

### 4.2 Variables de entorno del proyecto

En la sección **Environment Variables** (o en el archivo `.env` del compose), agrega:

```
SECRET_KEY=tu-clave-super-secreta-aqui-cambiala
DOMAIN=pdfforge.tudominio.com
```

> ⚠️ **Importante**: Cambia `SECRET_KEY` por una cadena aleatoria larga. Puedes generar una con:
> ```bash
> python3 -c "import secrets; print(secrets.token_hex(32))"
> ```

---

## Paso 5: Configurar volúmenes (almacenamiento persistente)

### 5.1 En la pestaña **Storage** o **Volumes**

EasyPanel normalmente maneja los volúmenes automáticamente con el `docker-compose.yml`. Si necesitas configurarlos manualmente:

1. Ve a la pestaña **Storage**
2. Asegúrate de que el volumen `pdfforge_data` esté mapeado
3. Esto preserva tus archivos PDF y conversiones entre reinicios

---

## Paso 6: Configurar dominio y SSL

### 6.1 Configurar DNS

En tu proveedor de dominios, crea un registro A:

```
Tipo: A
Nombre: pdfforge (o el subdominio que quieras)
Valor: IP de tu VPS
TTL: Auto
```

### 6.2 Configurar dominio en EasyPanel

1. Ve a **Domains** en el sidebar
2. Click **Add Domain**
3. Dominio: `pdfforge.tudominio.com`
4. Selecciona el servicio `pdfforge-frontend`
5. Port: `3000`
6. Habilita **SSL** (Let's Encrypt)
7. Click **Save**

### 6.3 Configurar el backend (API)

El frontend se comunica con el backend a través del proxy del compose. Si necesitas acceso directo al backend:

1. Agrega otro dominio o subdominio: `api.pdfforge.tudominio.com`
2. Apunta al servicio `pdfforge-backend`
3. Port: `8000`

---

## Paso 7: Desplegar

### 7.1 Build y Deploy

1. En el servicio compose, ve a **Deployments**
2. Click **Deploy** (o **Force Rebuild** si es la primera vez)
3. Espera a que el build termine (5-10 minutos la primera vez)

### 7.2 Verificar logs

1. Ve a **Logs** en el servicio
2. Deberías ver algo como:
   ```
   backend_1  | INFO:     Uvicorn running on http://0.0.0.0:8000
   frontend_1 | ▲ Next.js 16.3.0
   frontend_1 |   - Local: http://localhost:3000
   ```

### 7.3 Verificar salud

```bash
# Desde tu computadora
curl https://pdfforge.tudominio.com/api/health
# Debería retornar: {"status":"ok","version":"1.0.0"}
```

---

## Paso 8: Probar la aplicación

1. Abre `https://pdfforge.tudominio.com`
2. Registra una cuenta nueva
3. Sube un PDF de prueba
4. Verifica que la conversión funcione
5. Descarga el DOCX resultante

---

## Troubleshooting

### El build falla

```bash
# Ver logs del build
# En EasyPanel: Deployments → ver el output del build
```

### El frontend no conecta al backend

Verifica que `NEXT_PUBLIC_API_URL` esté configurado correctamente:
- En EasyPanel: Variables de entorno del frontend
- Debe ser: `https://pdfforge.tudominio.com` (sin slash al final)

### El backend no inicia

1. Revisa los logs del backend
2. Verifica que la variable `SECRET_KEY` esté definida
3. Verifica que `DATABASE_URL` apunte al volumen correcto

### Error 502 Bad Gateway

1. El backend puede estar arrancando aún (espera 30 segundos)
2. Verifica que el healthcheck pase
3. Revisa si hay errores en los logs

### Los archivos se borran al reiniciar

Asegúrate de que el volumen `pdfforge_data` esté correctamente configurado en EasyPanel.

---

## Comandos útiles en EasyPanel

| Acción | Dónde |
|--------|-------|
| Ver logs | Servicio → Logs |
| Shell al contenedor | Servicio → Shell |
| Reiniciar | Servicio → Restart |
| Rebuild completo | Servicio → Force Rebuild |
| Ver variables | Servicio → Environment |
| Gestionar dominios | Sidebar → Domains |

---

## Estructura final en EasyPanel

```
Project: pdfforge
├── Service: pdfforge (Compose)
│   ├── Container: pdfforge-backend (Python/FastAPI)
│   │   ├── Puerto: 8000
│   │   └── Volume: pdfforge_data:/app/data
│   └── Container: pdfforge-frontend (Next.js)
│       ├── Puerto: 3000
│       └── Proxy → backend
├── Domain: pdfforge.tudominio.com → frontend:3000 (SSL)
└── (Opcional) Domain: api.pdfforge.tudominio.com → backend:8000
```

---

## Seguridad

1. **Cambiar SECRET_KEY** en producción
2. **Usar SSL** (Let's Encrypt en EasyPanel)
3. **Restringir acceso SSH** con key-based auth
4. **Firewall**: solo abrir puertos 80, 443, 8096 (EasyPanel)
5. **Backups**: exportar el volumen `pdfforge_data` periódicamente
