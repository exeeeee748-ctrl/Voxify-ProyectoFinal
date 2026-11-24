import { getApiBaseUrl } from '../config/voxifyConfig';

const VOICE_PALETTE = ['#22d3ee', '#818cf8', '#c084fc', '#34d399', '#fbbf24', '#f472b6'];

async function parseResponse(response, startedAt) {
  const elapsedMs = Math.round(performance.now() - startedAt);
  const contentType = response.headers.get('content-type') || '';
  let data = null;

  if (contentType.includes('application/json')) {
    data = await response.json().catch(() => null);
  } else {
    const text = await response.text().catch(() => '');
    data = text ? { mensaje: text } : null;
  }

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    elapsedMs,
    data,
    networkError: false,
  };
}

function networkErrorResult(url, startedAt, error) {
  const elapsedMs = Math.round(performance.now() - startedAt);
  return {
    ok: false,
    status: 0,
    statusText: 'Sin conexión',
    elapsedMs,
    url,
    data: {
      error:
        'No se pudo conectar con el backend .NET. Verifica que esté encendido y que CORS permita este origen.',
      detalle: error?.message || String(error),
    },
    networkError: true,
  };
}

function buildUrl(path, baseUrl = getApiBaseUrl()) {
  return `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;
}

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body = undefined,
    includeCredentials = true,
    baseUrl = getApiBaseUrl(),
  } = options;

  const startedAt = performance.now();
  const url = buildUrl(path, baseUrl);

  const headers = {};
  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  try {
    const response = await fetch(url, {
      method,
      credentials: includeCredentials ? 'include' : 'omit',
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });

    return { ...(await parseResponse(response, startedAt)), url };
  } catch (error) {
    return networkErrorResult(url, startedAt, error);
  }
}

export async function apiUpload(path, formData, options = {}) {
  const {
    method = 'POST',
    includeCredentials = true,
    baseUrl = getApiBaseUrl(),
  } = options;

  const startedAt = performance.now();
  const url = buildUrl(path, baseUrl);

  try {
    const response = await fetch(url, {
      method,
      credentials: includeCredentials ? 'include' : 'omit',
      body: formData,
    });

    return { ...(await parseResponse(response, startedAt)), url };
  } catch (error) {
    return networkErrorResult(url, startedAt, error);
  }
}

export function getApiAssetUrl(path, baseUrl = getApiBaseUrl()) {
  return buildUrl(path, baseUrl);
}

export function getAudioUrl(idAudio, action = 'reproducir', baseUrl = getApiBaseUrl()) {
  return buildUrl(`/api/audios/${idAudio}/${action}`, baseUrl);
}

export function extractErrorMessage(result, fallback = 'Ocurrió un error inesperado.') {
  const data = result?.data;
  if (!data) return fallback;
  if (typeof data === 'string') return data;
  return (
    data.detail ||
    data.error ||
    data.mensaje ||
    data.title ||
    (data.errors ? Object.values(data.errors).flat().join(' ') : '') ||
    fallback
  );
}

export function normalizeUser(raw) {
  if (!raw) return null;

  const idUsuario = raw.idUsuario ?? raw.IdUsuario;
  if (idUsuario !== undefined && idUsuario !== null) {
    return {
      autenticado: true,
      nombre: raw.nombre ?? raw.Nombre ?? 'Usuario Voxify',
      correo: raw.correo ?? raw.Correo ?? '',
      estado: raw.estado ?? raw.Estado ?? 'Activo',
      idUsuario,
      proveedor: 'Desarrollo local',
      identificador: `#${idUsuario}`,
      rol: 'Usuario',
      permisos: [],
      raw,
    };
  }

  const autenticado = raw.autenticado ?? raw.Autenticado ?? false;
  if (!autenticado) return null;

  return {
    autenticado: Boolean(autenticado),
    nombre: raw.nombre ?? raw.Nombre ?? 'Usuario Voxify',
    correo: raw.correo ?? raw.Correo ?? '',
    estado: raw.estado ?? raw.Estado ?? 'Activo',
    proveedor: raw.proveedor ?? raw.Proveedor ?? 'Externo',
    identificador: raw.identificador ?? raw.Identificador ?? '—',
    rol: raw.rol ?? raw.Rol ?? 'Usuario',
    permisos: raw.permisos ?? raw.Permisos ?? [],
    raw,
  };
}

export function normalizeIdioma(raw) {
  if (!raw) return null;
  const id = raw.idIdioma ?? raw.IdIdioma ?? raw.id ?? raw.Id;
  if (id === undefined || id === null) return null;

  return {
    id,
    idIdioma: id,
    nombre: raw.nombre ?? raw.Nombre ?? 'Idioma',
    codigo: raw.codigo ?? raw.Codigo ?? '',
    activo: raw.activo ?? raw.Activo ?? true,
    raw,
  };
}

export function normalizeVoz(raw, index = 0) {
  if (!raw) return null;
  const id = raw.idVoz ?? raw.IdVoz ?? raw.id ?? raw.Id;
  if (id === undefined || id === null) return null;

  const tipo = raw.tipo ?? raw.Tipo ?? 'Predeterminada';
  const descripcion = raw.descripcion ?? raw.Descripcion ?? '';
  const genero = raw.genero ?? raw.Genero ?? '';
  const acento = raw.acento ?? raw.Acento ?? '';
  const estado = raw.estado ?? raw.Estado ?? '';
  const idiomas = raw.idiomas ?? raw.Idiomas ?? [];
  const tono = [genero, acento, descripcion].filter(Boolean).join(' · ');

  return {
    id,
    idVoz: id,
    name: raw.nombre ?? raw.Nombre ?? 'Voz sin nombre',
    nombre: raw.nombre ?? raw.Nombre ?? 'Voz sin nombre',
    type: tipo,
    tipo,
    tone: tono || (tipo === 'Clonada' ? 'Voz personalizada' : 'Voz neural multilingüe'),
    descripcion,
    genero,
    acento,
    estado,
    accent: VOICE_PALETTE[index % VOICE_PALETTE.length],
    languages: Array.isArray(idiomas) ? idiomas : [],
    pitch: 1 + (index % 3) * 0.04,
    rate: 1,
    sampleLabel: [tipo, estado].filter(Boolean).join(' · ') || 'Kitten TTS 2',
    raw,
  };
}

export function normalizeGeneracion(raw) {
  if (!raw) return null;
  const id = raw.idSolicitudGeneracion ?? raw.IdSolicitudGeneracion ?? raw.id ?? raw.Id;
  if (id === undefined || id === null) return null;

  return {
    id,
    idSolicitudGeneracion: id,
    texto: raw.texto ?? raw.Texto ?? '',
    estado: raw.estado ?? raw.Estado ?? '',
    fechaSolicitud: raw.fechaSolicitud ?? raw.FechaSolicitud ?? null,
    fechaFinalizacion: raw.fechaFinalizacion ?? raw.FechaFinalizacion ?? null,
    mensajeError: raw.mensajeError ?? raw.MensajeError ?? null,
    idVoz: raw.idVoz ?? raw.IdVoz ?? null,
    nombreVoz: raw.nombreVoz ?? raw.NombreVoz ?? null,
    idIdioma: raw.idIdioma ?? raw.IdIdioma ?? null,
    nombreIdioma: raw.nombreIdioma ?? raw.NombreIdioma ?? null,
    idAudio: raw.idAudio ?? raw.IdAudio ?? null,
    audio: null,
    raw,
  };
}

export function normalizeAudio(raw) {
  if (!raw) return null;
  const id = raw.idAudio ?? raw.IdAudio ?? raw.id ?? raw.Id;
  if (id === undefined || id === null) return null;

  return {
    id,
    idAudio: id,
    nombreArchivo: raw.nombreArchivo ?? raw.NombreArchivo ?? '',
    formato: raw.formato ?? raw.Formato ?? '',
    tamanoBytes: raw.tamanoBytes ?? raw.TamanoBytes ?? null,
    fechaCreacion: raw.fechaCreacion ?? raw.FechaCreacion ?? null,
    duracionSegundos: raw.duracionSegundos ?? raw.DuracionSegundos ?? null,
    estado: raw.estado ?? raw.Estado ?? '',
    idUsuario: raw.idUsuario ?? raw.IdUsuario ?? null,
    idVoz: raw.idVoz ?? raw.IdVoz ?? null,
    idIdioma: raw.idIdioma ?? raw.IdIdioma ?? null,
    raw,
  };
}

export function normalizeClonacion(raw) {
  if (!raw) return null;
  const id = raw.idSolicitudClonacion ?? raw.IdSolicitudClonacion ?? raw.id ?? raw.Id;
  if (id === undefined || id === null) return null;

  return {
    id,
    idSolicitudClonacion: id,
    voiceName: raw.nombreVoz ?? raw.NombreVoz ?? 'Voz sin nombre',
    status: raw.estado ?? raw.Estado ?? 'Pendiente',
    createdAt: raw.fechaSolicitud ?? raw.FechaSolicitud ?? null,
    finishedAt: raw.fechaFinalizacion ?? raw.FechaFinalizacion ?? null,
    errorMessage: raw.mensajeError ?? raw.MensajeError ?? null,
    idMuestra: raw.idMuestra ?? raw.IdMuestra ?? null,
    idVozClonada: raw.idVozClonada ?? raw.IdVozClonada ?? null,
    raw,
  };
}

export function buildProviderLoginUrl(loginPath, baseUrl = getApiBaseUrl()) {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const returnUrl = window.location.origin;
  return `${cleanBase}${loginPath}?returnUrl=${encodeURIComponent(returnUrl)}`;
}
