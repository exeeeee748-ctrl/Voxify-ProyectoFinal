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
