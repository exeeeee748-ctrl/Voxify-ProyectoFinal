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
    id: 'twitch',
    name: 'Twitch',
    badge: 'OAuth 2.0',
    description: 'Acceso rápido con tu cuenta de Twitch',
    loginPath: '/api/auth/login/twitch',
    accentClass: 'provider-twitch',
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    badge: 'OAuth 2.0',
    description: 'Acceso con cuenta Microsoft o institucional',
    loginPath: '/api/auth/login/microsoft',
    accentClass: 'provider-microsoft',
  },
];

export const PROTECTED_ENDPOINTS = [
  {
    id: 'me',
    method: 'GET',
    path: '/api/auth/me',
    label: 'Identidad autenticada',
    description: 'Devuelve nombre, proveedor e identificador del usuario con sesión activa.',
  },
  {
    id: 'idiomas',
    method: 'GET',
    path: '/api/Idiomas',
    label: 'Catálogo de Idiomas',
    description: 'Lista los idiomas activos disponibles para síntesis de voz.',
  },
  {
    id: 'solicitudes',
    method: 'GET',
    path: '/api/SolicitudesGeneracion',
    label: 'Solicitudes de Generación',
    description: 'Historial de textos enviados para conversión TTS.',
  },
  {
    id: 'audios',
    method: 'GET',
    path: '/api/Audios',
    label: 'Audios Generados',
    description: 'Metadatos y rutas de los archivos de audio producidos.',
  },
  {
    id: 'historial',
    method: 'GET',
    path: '/api/HistorialAudios',
    label: 'Historial Visible',
    description: 'Registros visibles en el historial personal de audios.',
  },
];

export const AUTHORIZED_REPORTS = [
  {
    id: 'reporte-ezequiel',
    title: 'Resumen de Producción de Audios por Idioma',
    author: 'Ezequiel Gallardo',
    tables: ['Idiomas', 'SolicitudesGeneracion', 'Audios', 'HistorialAudios'],
    purpose:
      'Combina las solicitudes de generación, los audios producidos y los registros visibles en el historial agrupados por idioma activo.',
    endpoint: '/api/Reportes/produccion-audios',
    authorization: 'Política ReporteProduccionAudios · Rol AnalistaReportes + permiso reportes:produccion:leer',
    demoPayload: {
      autor: 'Ezequiel Gallardo',
      proposito:
        'Combinar idiomas activos, solicitudes de generación, audios producidos y registros de historial para medir la producción vocal por idioma.',
      endpoint: '/api/Reportes/produccion-audios',
      tablasUtilizadas: ['Idiomas', 'SolicitudesGeneracion', 'Audios', 'HistorialAudios'],
      politicaAutorizacion:
        'ReporteProduccionAudios (Rol: AnalistaReportes · Permiso: reportes:produccion:leer)',
      resumenGeneral: {
        totalIdiomasActivos: 3,
        totalSolicitudesActivas: 27,
        totalAudiosActivos: 24,
        totalVisiblesEnHistorial: 21,
        totalOcultosEnHistorial: 3,
        tasaConversionPorcentaje: 88.9,
      },
      datos: [
        {
          idioma: 'Español (es-ES)',
          totalSolicitudes: 14,
          completadas: 12,
          pendientes: 2,
          audiosActivos: 12,
          visiblesEnHistorial: 10,
          ocultosEnHistorial: 2,
          ultimoAudio: 'bienvenida_voxify_es.mp3',
        },
        {
          idioma: 'English (en-US)',
          totalSolicitudes: 9,
          completadas: 8,
          pendientes: 1,
          audiosActivos: 8,
          visiblesEnHistorial: 7,
          ocultosEnHistorial: 1,
          ultimoAudio: 'intro_kitten_tts2_en.mp3',
        },
        {
          idioma: 'Português (pt-BR)',
          totalSolicitudes: 4,
          completadas: 4,
          pendientes: 0,
          audiosActivos: 4,
          visiblesEnHistorial: 4,
          ocultosEnHistorial: 0,
          ultimoAudio: 'narracion_demo_pt.mp3',
        },
      ],
    },
  },
];

export const KITTEN_VOICES = [
  {
    id: 'kitten-aura-es',
    name: 'Aura',
    type: 'Predeterminada',
    tone: 'Cálida · Narración',
    accent: '#22D3EE',
    languages: ['es', 'en', 'pt'],
    pitch: 1.04,
    rate: 1.0,
    sampleLabel: '48 kHz · Neural',
  },
  {
    id: 'kitten-orion-multi',
    name: 'Orion',
    type: 'Predeterminada',
    tone: 'Profunda · Podcast',
    accent: '#818CF8',
    languages: ['es', 'en', 'fr', 'de'],
    pitch: 0.88,
    rate: 0.96,
    sampleLabel: '48 kHz · Studio',
  },
  {
    id: 'kitten-lyra-es',
    name: 'Lyra',
    type: 'Predeterminada',
    tone: 'Expresiva · Dinámica',
    accent: '#C084FC',
    languages: ['es', 'en', 'it'],
    pitch: 1.12,
    rate: 1.04,
    sampleLabel: '48 kHz · Expressive',
  },
  {
    id: 'kitten-clone-studio',
    name: 'Mi Voz Studio',
    type: 'Clonada',
    tone: 'Zero-shot · 15s ref',
    accent: '#34D399',
    languages: ['es', 'en'],
    pitch: 1.0,
    rate: 1.0,
    sampleLabel: 'Kitten TTS 2 · Clone',
  },
];

export const DEMO_USER = {
  autenticado: true,
  nombre: 'Ezequiel Gallardo (Vista Demo)',
  proveedor: 'Twitch',
  identificador: 'demo-twitch-904821',
  rol: 'AnalistaReportes',
  permisos: ['recursos:basicos', 'reportes:produccion:leer'],
};

export const DEMO_IDIOMAS = [
  { id: 1, nombre: 'Español', codigo: 'es-ES', activo: true },
  { id: 2, nombre: 'English', codigo: 'en-US', activo: true },
  { id: 3, nombre: 'Português', codigo: 'pt-BR', activo: true },
  { id: 4, nombre: 'Français', codigo: 'fr-FR', activo: true },
];

export const DEMO_HISTORIAL = [
  {
    id: 101,
    audioId: 11,
    fechaRegistro: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
    visible: true,
    voiceName: 'Aura',
    languageName: 'Español',
    duration: '0:14',
    texto: 'Bienvenido a Voxify, tu estudio web de conversión de texto a voz impulsado por Kitten TTS 2.',
    audio: {
      id: 11,
      nombreArchivo: 'bienvenida_voxify_es.mp3',
      rutaArchivo: '/audios/bienvenida_voxify_es.mp3',
      fechaCreacion: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
      solicitudGeneracionId: 21,
      activo: true,
    },
  },
  {
    id: 102,
    audioId: 12,
    fechaRegistro: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    visible: true,
    voiceName: 'Orion',
    languageName: 'English',
    duration: '0:22',
    texto: 'Kitten TTS 2 delivers crystal clear neural voice synthesis across more than twenty languages.',
    audio: {
      id: 12,
      nombreArchivo: 'intro_kitten_tts2_en.mp3',
      rutaArchivo: '/audios/intro_kitten_tts2_en.mp3',
      fechaCreacion: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
      solicitudGeneracionId: 22,
      activo: true,
    },
  },
  {
    id: 103,
    audioId: 13,
    fechaRegistro: new Date(Date.now() - 1000 * 60 * 380).toISOString(),
    visible: true,
    voiceName: 'Mi Voz Studio',
    languageName: 'Español',
    duration: '0:09',
    texto: 'Prueba de clonación vocal con muestra de referencia de quince segundos.',
    audio: {
      id: 13,
      nombreArchivo: 'prueba_clonacion_studio.mp3',
      rutaArchivo: '/audios/prueba_clonacion_studio.mp3',
      fechaCreacion: new Date(Date.now() - 1000 * 60 * 380).toISOString(),
      solicitudGeneracionId: 23,
      activo: true,
    },
  },
];
