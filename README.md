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

Twitch y Microsoft son opcionales: si no se configuran, la aplicacion inicia igualmente, los
endpoints protegidos responden `401` y `GET /api/auth/login/...` responde `503` con un mensaje
explicando que falta la configuracion. La autenticacion por cookie sigue activa.

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

Las rutas de recursos usan un usuario local de desarrollo mientras se difiere OAuth
(especificacion, seccion 1.1):

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
