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
- Twitch y Microsoft OAuth

## Configuracion

Las credenciales no deben guardarse en el repositorio. Configure estas variables de entorno:

```bash
export ConnectionStrings__DefaultConnection='Host=localhost;Database=voxify;Username=postgres;Password=...'
export TWITCH_CLIENT_ID='...'
export TWITCH_CLIENT_SECRET='...'
export MICROSOFT_CLIENT_ID='...'
export MICROSOFT_CLIENT_SECRET='...'
```

Hay un modelo sin secretos en `backend-dotnet/appsettings.Example.json`.

## Ejecucion

```bash
cd backend-dotnet
dotnet restore
dotnet ef database update
dotnet run
```

Registre las URLs de retorno en los proveedores:

- Twitch: `https://localhost:puerto/signin-twitch`
- Microsoft: `https://localhost:puerto/signin-microsoft`

## Endpoints

Las rutas de recursos requieren autenticacion por cookie:

- `GET|POST /api/Idiomas`
- `GET|PUT|DELETE /api/Idiomas/{id}`
- `GET|POST /api/SolicitudesGeneracion`
- `GET|PUT|DELETE /api/SolicitudesGeneracion/{id}`
- `GET|POST /api/Audios`
- `GET|PUT|DELETE /api/Audios/{id}`
- `GET|POST /api/HistorialAudios`
- `GET|PUT|DELETE /api/HistorialAudios/{id}`

Inicio de sesion:

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
