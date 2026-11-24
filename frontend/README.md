# Voxify Frontend

Interfaz web de **Voxify** (conversión de texto a voz con Kitten TTS 2) conectada al backend
`.NET`, al microservicio **FastAPI** y al SSO de **TikTok, Microsoft y Twitch**.

## Autenticación

La aplicación inicia sesión con OAuth 2.0 / OIDC:

- **TikTok** (Login Kit + PKCE)
- **Microsoft** (Entra ID)
- **Twitch**

El botón de cada proveedor se habilita solo si el backend lo tiene configurado. El callback se
procesa en el backend y este emite una cookie `HttpOnly` propia de Voxify. La vista
`Mi Cuenta & API` permite ver los proveedores vinculados, vincular uno nuevo y editar el perfil.

Si `ALLOW_DEV_USER=true` en el backend, también aparece un acceso de desarrollo para probar la
aplicación sin credenciales OAuth.

Al abrir la aplicación se consulta:

```text
GET /api/auth/me
```

y luego se cargan en paralelo:

| Recurso | Endpoint |
| :--- | :--- |
| Idiomas | `GET /api/idiomas` |
| Voces predeterminadas | `GET /api/voces` |
| Voces clonadas del usuario | `GET /api/usuarios/me/voces-clonadas` |
| Favoritos | `GET /api/usuarios/me/favoritos/voces` |
| Generaciones | `GET /api/usuarios/me/generaciones` |
| Clonaciones | `GET /api/usuarios/me/clonaciones` |
| Configuración | `GET /api/usuarios/me/configuracion` |

### Estudio de Voz

1. `POST /api/generaciones` con `{ texto, idVoz, idIdioma }`.
2. `POST /api/generaciones/{id}/sintetizar` con `{ formato, velocidad }`.
3. Reproducción y descarga autenticadas desde `/api/audios/{id}/reproducir` y
   `/api/audios/{id}/descargar`.

### Voces y clonación

- Favoritos: `POST` / `DELETE /api/usuarios/me/favoritos/voces/{idVoz}`.
- Clonación: `POST /api/clonaciones` en `multipart/form-data` con `nombreVoz` y `archivo`.
- Seguimiento: `GET /api/usuarios/me/clonaciones`.

### Historial

Se construye con las generaciones del usuario. La duración, formato y estado del audio se
consultan en `GET /api/audios/{id}`. La acción “Ocultar” usa
`DELETE /api/audios/{id}` y mantiene el archivo físico.

### Reportes

`GET /api/Reportes/produccion-audios` está protegido por la política
`ReporteProduccionAudios`. Los usuarios que inician sesión con Twitch reciben el rol
`AnalistaReportes`; otros proveedores reciben el rol `Usuario`.

## Ejecución en desarrollo

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abre `http://localhost:3000`. El backend `.NET` debe estar en `http://localhost:5173`
y FastAPI en `http://localhost:8000` para la síntesis real.

## Variables importantes

- `VITE_API_URL`: URL pública del backend `.NET` (por defecto `http://localhost:5173`).
- En el backend, configura `FRONTEND_URL=http://localhost:3000` o
  `CORS_ORIGINS=http://localhost:3000,http://localhost:8080`.
