# Voxify

Proyecto .NET para la gestion de idiomas, solicitudes de generacion, audios e historial.

## Reparto de trabajo

| Integrante | Tablas responsables | Proveedores |
|---|---|---|
| Ezequiel Gallardo | Idiomas, SolicitudesGeneracion, Audios, HistorialAudios | Twitch (facil), Microsoft (media) |

## Tecnologias

- ASP.NET Core 10
- Entity Framework Core
- PostgreSQL
- OAuth 2.0 / OIDC: TikTok, Microsoft Entra ID y Twitch
- Cookie de sesión propia de Voxify

## Autenticacion OAuth 2.0 / OIDC

Voxify usa un flujo unificado `state` + PKCE y mantiene su propia sesion por cookie.
Las credenciales se leen desde `backend-dotnet/.env` (ver `.env.example`) o variables de
entorno. Nunca se guardan en Git.

```env
APP_SECRET_KEY=clave_secreta_larga_y_aleatoria
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:5173

TIKTOK_CLIENT_KEY=...
TIKTOK_CLIENT_SECRET=...
TIKTOK_REDIRECT_URI=http://localhost:5173/auth/tiktok/callback

MICROSOFT_CLIENT_ID=...
MICROSOFT_CLIENT_SECRET=...
MICROSOFT_TENANT_ID=common
MICROSOFT_REDIRECT_URI=http://localhost:5173/auth/microsoft/callback

TWITCH_CLIENT_ID=...
TWITCH_CLIENT_SECRET=...
TWITCH_REDIRECT_URI=http://localhost:5173/auth/twitch/callback

ALLOW_DEV_USER=true
```

Registra exactamente estas URLs de retorno en cada portal:

- TikTok: `http://localhost:5173/auth/tiktok/callback` (scope `user.info.basic`)
- Microsoft: `http://localhost:5173/auth/microsoft/callback` (scopes `openid profile email User.Read`)
- Twitch: `http://localhost:5173/auth/twitch/callback` (scopes `openid user:read:email`)

`ALLOW_DEV_USER=true` habilita el acceso local de desarrollo mientras no haya credenciales
OAuth. En produccion debe ser `false`.

### Endpoints de autenticacion

| Metodo | Ruta | Descripcion |
| :--- | :--- | :--- |
| `GET` | `/api/auth/providers` · `/auth/providers` | Estado de configuracion de cada proveedor. |
| `GET` | `/api/auth/login/{provider}` · `/auth/{provider}/login` | Inicia el flujo OAuth. |
| `GET` | `/auth/{provider}/callback` | Callback interno del proveedor. |
| `GET` | `/api/auth/me` · `/auth/me` | Usuario interno, proveedor y cuentas vinculadas. |
| `POST` | `/api/auth/logout` · `/auth/logout` | Invalida la cookie de sesion. |
| `POST` | `/api/auth/dev-login` | Acceso de desarrollo (solo si `ALLOW_DEV_USER`). |

Los recursos de usuario (`/api/usuarios/me`, generaciones, audios, favoritos, clonaciones y
configuracion) requieren la cookie de sesion de Voxify. Los catalogos `/api/idiomas` y
`/api/voces` son publicos.

## Ejecucion

```bash
cd backend-dotnet
dotnet restore
dotnet ef database update
dotnet run
```

El modelo sin secretos esta en `backend-dotnet/appsettings.Example.json` y las variables de
autenticacion en `backend-dotnet/.env.example`.

## Endpoints

Las rutas de recursos requieren la cookie de sesión de Voxify (OAuth o acceso de desarrollo):

- `GET|PUT /api/usuarios/me`
- `GET /api/idiomas`, `GET /api/idiomas/{id}`
- `GET /api/voces`, `GET /api/voces/{id}` (filtros `?idiomaId=` y `?tipo=`)
- `GET /api/usuarios/me/voces-clonadas`, `GET /api/voces-clonadas/{id}`
- `POST /api/generaciones`, `GET /api/generaciones/{id}`
- `GET /api/usuarios/me/generaciones`
- `POST /api/generaciones/{id}/sintetizar`
- `GET /api/audios/{id}`, `GET /api/audios/{id}/reproducir`, `GET /api/audios/{id}/descargar`
- `DELETE /api/audios/{id}` (oculta el audio, no borra el archivo)
- `GET|POST|DELETE /api/usuarios/me/favoritos/voces[/{idVoz}]`
- `GET|POST|DELETE /api/usuarios/me/favoritos/idiomas[/{idIdioma}]`
- `GET|PUT /api/usuarios/me/configuracion`
- `POST /api/clonaciones`, `GET /api/clonaciones/{id}`
- `GET /api/usuarios/me/clonaciones`

## Sintesis de voz (microservicio TTS)

El endpoint `POST /api/generaciones/{id}/sintetizar` toma el texto de una solicitud,
lo envia a `POST /tts/generate` del microservicio FastAPI, guarda el audio generado en
`Storage/audios` y registra el archivo en la tabla `Audios`.

APIs internas de FastAPI (no expuestas al navegador):

| Metodo | Ruta | Descripcion |
| :--- | :--- | :--- |
| `GET` | `/health` | Estado del proceso. |
| `GET` | `/ready` | Estado del modelo TTS cargado. |
| `GET` | `/tts/voices` | Voces reconocidas por la instalacion local. |
| `GET` | `/tts/languages` | Idiomas soportados por la instalacion local. |
| `POST` | `/tts/generate` | Sintesis de texto a audio (binario). |
| `POST` | `/tts/clone` | Clonacion desde una muestra de referencia (binario). |

Se conservan alias retrocompatibles bajo `/v1/tts/...` que no aparecen en OpenAPI.

La configuracion se toma de `appsettings.json` o de variables de entorno:

| Variable | Valor por defecto | Descripcion |
| :--- | :--- | :--- |
| `Tts__BaseUrl` | `http://localhost:8000` | URL del microservicio TTS. |
| `Tts__MaxTextLength` | `1500` | Longitud maxima del texto a sintetizar. |
| `Tts__TimeoutSeconds` | `120` | Tiempo maximo de espera de la sintesis. |
| `Tts__StoragePath` | `Storage/audios` | Carpeta donde se guardan los audios (relativa al proyecto). |
| `Tts__DefaultSpanishVoice` | `SpanishNews` | Voz usada cuando el idioma es espanol y no se indica una. |
| `Tts__DefaultVoice` | `default` | Voz usada para los demas idiomas. |

El cuerpo es opcional; todos sus campos tambien lo son:

```json
{
  "voz": "SpanishAbuela",
  "velocidad": 1.0,
  "formato": "wav"
}
```

- `GET /api/auth/login/twitch`
- `GET /api/auth/login/microsoft`
- `GET /api/auth/me`
- `POST /api/auth/logout`


## Entorno de desarrollo con Docker Compose (Punto 4)

El archivo `docker-compose.dev.yml` levanta la base de datos **PostgreSQL 16** (con volumen persistente `voxify_pgdata` y red `voxify_dev_net`) y construye el backend `.NET` a partir de `backend-dotnet/Dockerfile.EzequielGallardo`.

### 1. Preparar variables de entorno

```bash
cp .env.example .env
```

Edita `.env` para colocar tus credenciales reales de `TWITCH_CLIENT_ID`, `TWITCH_CLIENT_SECRET`, `MICROSOFT_CLIENT_ID` y `MICROSOFT_CLIENT_SECRET`.

### 2. Levantar el entorno de desarrollo

```bash
docker compose -f docker-compose.dev.yml up --build -d
```

- **Backend API:** `http://localhost:5173` (puerto interno del contenedor: `8080`)
- **Healthcheck + conexión BD:** `http://localhost:5173/health`
- **PostgreSQL:** `localhost:5432` (datos conservados en el volumen `voxify_pgdata`)

### 3. Migraciones de la base de datos

- **Automáticas (por defecto):** con `AUTO_MIGRATE=true` en `.env`, el backend ejecuta `Database.Migrate()` automáticamente al iniciar y crea las tablas (`Idiomas`, `SolicitudesGeneracion`, `Audios`, `HistorialAudios`).
- **Manuales (alternativa desde tu máquina):** si prefieres aplicarlas manualmente con EF Core CLI (`AUTO_MIGRATE=false`):

```bash
cd backend-dotnet
export ConnectionStrings__DefaultConnection='Host=localhost;Port=5432;Database=voxify;Username=postgres;Password=voxify_dev_pass'
dotnet ef database update
```

### 4. Comprobar funcionamiento y persistencia

```bash
# Verificar conexión del backend con PostgreSQL y conteo de tablas
curl -s http://localhost:5173/health

# Verificar que los endpoints protegidos rechazan peticiones sin sesión (401)
curl -i http://localhost:5173/api/Idiomas
curl -i http://localhost:5173/api/Reportes/produccion-audios

# Detener contenedores conservando el volumen de PostgreSQL
docker compose -f docker-compose.dev.yml down
```


## Frontend integrado al mismo Compose (Punto 5)

El mismo archivo `docker-compose.dev.yml` incluye el servicio **`frontend`** construido desde `frontend/Dockerfile` y servido mediante **Nginx** (puerto `${FRONTEND_PORT:-3000}:80`), conectado a la misma red `voxify_dev_net`.

### Levantar base de datos, backend y frontend en un solo comando

```bash
cp .env.example .env
docker compose -f docker-compose.dev.yml up --build -d
```

- **Frontend web (Nginx):** `http://localhost:3000`
- **Backend API (.NET):** `http://localhost:5173` (configurado para el navegador mediante `VITE_API_URL=http://localhost:5173`)
- **URL de retorno y CORS:** `FRONTEND_URL=http://localhost:3000` y `CORS_ORIGINS=http://localhost:3000,http://localhost:5174,http://localhost:8080`
- **Callbacks OAuth:** `http://localhost:5173/auth/tiktok/callback`, `http://localhost:5173/auth/twitch/callback`, `http://localhost:5173/auth/microsoft/callback`

### Verificación desde el navegador

1. Abrir `http://localhost:3000` (redirige a `/login` mostrando los proveedores OAuth configurados: TikTok, Microsoft y Twitch).
2. Probar acceso sin sesión → el backend rechaza con `401 Unauthorized`.
3. Iniciar sesión con un proveedor real, verificar la identidad autenticada, consultar `/reportes` (`200 OK` autorizado / `403` sin permisos) y cerrar sesión comprobando el bloqueo posterior.


## Imagen publicada en Docker Hub (Punto 6)

- **Repositorio en Docker Hub:** `https://hub.docker.com/r/12882321docker/voxify-backend/tags`
- **Referencia completa:** `12882321docker/voxify-backend:1.0.0`
- **Dockerfile oficial utilizado:** `backend-dotnet/Dockerfile.EzequielGallardo`

```bash
# Comprobar descarga directa desde Docker Hub
docker pull 12882321docker/voxify-backend:1.0.0
```

## Entorno de release con cuatro instancias (Punto 7)

El archivo `docker-compose.release.yml` descarga directamente la imagen publicada (`12882321docker/voxify-backend:1.0.0`) **sin compilar código fuente**, levanta PostgreSQL 16 con persistencia (`voxify_release_pgdata`) y **cuatro instancias del backend** en los puertos `5001`, `5002`, `5003` y `5004` (mapeados al puerto interno `8080`).

### Sesiones compatibles entre las 4 instancias
Las 4 instancias comparten el volumen `voxify_release_dpkeys:/app/Storage/keys`, donde ASP.NET Core Data Protection guarda el anillo de claves (`SetApplicationName("Voxify")`). Así, una cookie `Voxify.Auth` emitida en `http://localhost:5001` es reconocida automáticamente en `5002`, `5003` y `5004`.

### Levantar y verificar el release

```bash
cp -n .env.example .env
docker compose -f docker-compose.release.yml pull
docker compose -f docker-compose.release.yml up -d
docker compose -f docker-compose.release.yml ps

# Verificar /health y rechazo 401 en los 4 puertos
for port in 5001 5002 5003 5004; do
  echo "=== Puerto $port ==="
  curl -s http://localhost:$port/health; echo ""
  curl -s -o /dev/null -w "Reporte sin sesion: HTTP %{http_code}\n" http://localhost:$port/api/Reportes/produccion-audios
done
```
