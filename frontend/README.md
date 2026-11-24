# Voxify Frontend

Interfaz web de **Voxify** (conversión de texto a voz con Kitten TTS 2) conectada al backend `.NET` del equipo.

## Qué incluye

- **Punto 1 (Login y Logout):** botones reales para **Twitch** (`/api/auth/login/twitch`) y **Microsoft** (`/api/auth/login/microsoft`), retorno automático a la app, identidad del usuario autenticado (`/api/auth/me`), cierre de sesión (`POST /api/auth/logout`) y comprobación en vivo de rechazo `401 Unauthorized` tras salir.
- **Punto 2 (Reportes Autorizados):** vista dedicada con autor, tablas, propósito, endpoint y botones para probar acceso con sesión (`200 OK`) y sin sesión (`401`).
- **Estudio de Voz e Historial:** diseño acústico con onda animada, carga de archivos `.txt`, contador de palabras/caracteres, catálogo de idiomas (`/api/Idiomas`), generación (`/api/SolicitudesGeneracion`) e historial con eliminación lógica (`/api/HistorialAudios`).
- **Punto 5 (Docker / Nginx):** `Dockerfile` multi-etapa con Nginx listo para integrarse al `docker-compose`.

## Ejecución en desarrollo

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

Abre `http://localhost:3000` (el backend `.NET` corre en `http://localhost:5173`).

## Variables importantes

- `VITE_API_URL`: URL pública del backend que usará el navegador (por defecto `http://localhost:5173`).
- En el backend `.NET`, configura `FRONTEND_URL=http://localhost:3000` (o `CORS_ORIGINS=http://localhost:3000,http://localhost:8080`).
