const DEFAULT_API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5173').replace(/\/$/, '');

export function getApiBaseUrl() {
  if (typeof window === 'undefined') return DEFAULT_API_URL;
  const stored = window.localStorage.getItem('voxify_api_url');
  return (stored || DEFAULT_API_URL).replace(/\/$/, '');
}

export function setApiBaseUrl(url) {
  if (typeof window === 'undefined') return;
  const clean = (url || DEFAULT_API_URL).trim().replace(/\/$/, '');
  window.localStorage.setItem('voxify_api_url', clean);
}

export const AUTH_PROVIDERS = [
  {
    id: 'tiktok',
    name: 'TikTok',
    badge: 'OAuth 2.0 + PKCE',
    description: 'Login Kit · user.info.basic',
    loginPath: '/api/auth/login/tiktok',
    accentClass: 'provider-tiktok',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    badge: 'OAuth 2.0 + OIDC',
    description: 'Entra ID · openid profile email User.Read',
    loginPath: '/api/auth/login/microsoft',
    accentClass: 'provider-microsoft',
  },
  {
    id: 'twitch',
    name: 'Twitch',
    badge: 'OAuth 2.0 + OIDC',
    description: 'Twitch · openid user:read:email',
    loginPath: '/api/auth/login/twitch',
    accentClass: 'provider-twitch',
  },
];

export const API_ENDPOINTS = [
  {
    id: 'usuario',
    method: 'GET',
    path: '/api/usuarios/me',
    label: 'Usuario de la sesión',
    description: 'Identidad interna de Voxify resuelta desde la cookie de sesión.',
  },
  {
    id: 'sesiones',
    method: 'GET',
    path: '/api/auth/sesiones',
    label: 'Sesiones PostgreSQL (SSO)',
    description: 'Sesiones activas y revocadas en PostgreSQL para Single Sign-Out.',
  },
  {
    id: 'idiomas',
    method: 'GET',
    path: '/api/idiomas',
    label: 'Catálogo de idiomas',
    description: 'Idiomas activos disponibles para la síntesis de voz.',
  },
  {
    id: 'voces',
    method: 'GET',
    path: '/api/voces',
    label: 'Catálogo de voces',
    description: 'Voces predeterminadas del catálogo de negocio.',
  },
  {
    id: 'generaciones',
    method: 'GET',
    path: '/api/usuarios/me/generaciones',
    label: 'Generaciones del usuario',
    description: 'Solicitudes de generación con su audio asociado.',
  },
  {
    id: 'clonaciones',
    method: 'GET',
    path: '/api/usuarios/me/clonaciones',
    label: 'Solicitudes de clonación',
    description: 'Historial de solicitudes de clonación del usuario.',
  },
  {
    id: 'favoritos',
    method: 'GET',
    path: '/api/usuarios/me/favoritos/voces',
    label: 'Voces favoritas',
    description: 'Voces guardadas como favoritas por el usuario.',
  },
];

export const AUTHORIZED_REPORTS = [
  {
    id: 'reporte-produccion',
    title: 'Resumen de Producción de Audios por Idioma',
    author: 'Ezequiel Gallardo',
    tables: ['Idiomas', 'SolicitudesGeneracion', 'Audios', 'HistorialAudios'],
    purpose:
      'Combina las solicitudes de generación, los audios producidos y los registros visibles en el historial agrupados por idioma activo.',
    endpoint: '/api/Reportes/produccion-audios',
    authorization: 'Política ReporteProduccionAudios · Rol AnalistaReportes + permiso reportes:produccion:leer',
  },
];
