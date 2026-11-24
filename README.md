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

`voz` acepta el nombre o el `voice_id` del catalogo del microservicio, `velocidad` va de
`0.5` a `2.0` y `formato` acepta `wav`, `mp3` u `ogg`. La respuesta es el audio binario,
con los headers `X-Sample-Rate`, `X-Audio-Format`, `X-Audio-Size` y `X-Duration-Seconds`.
