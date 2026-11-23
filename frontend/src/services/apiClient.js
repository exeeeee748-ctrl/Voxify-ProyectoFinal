import { getApiBaseUrl } from '../config/voxifyConfig';

export async function apiRequest(path, options = {}) {
  const {
    method = 'GET',
    body = undefined,
    includeCredentials = true,
    baseUrl = getApiBaseUrl(),
  } = options;

  const startedAt = performance.now();
  const url = `${baseUrl.replace(/\/$/, '')}${path.startsWith('/') ? path : `/${path}`}`;

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
      url,
      data,
      networkError: false,
    };
  } catch (error) {
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
}

export function normalizeUser(raw) {
  if (!raw) return null;
  const autenticado = raw.autenticado ?? raw.Autenticado ?? false;
  if (!autenticado) return null;

  return {
    autenticado: Boolean(autenticado),
    nombre: raw.nombre ?? raw.Nombre ?? 'Usuario Voxify',
    proveedor: raw.proveedor ?? raw.Proveedor ?? 'Externo',
    identificador: raw.identificador ?? raw.Identificador ?? '—',
    rol: raw.rol ?? raw.Rol ?? 'Usuario',
    permisos: raw.permisos ?? raw.Permisos ?? [],
    raw,
  };
}

export function buildProviderLoginUrl(loginPath, baseUrl = getApiBaseUrl()) {
  const cleanBase = baseUrl.replace(/\/$/, '');
  const returnUrl = window.location.origin;
  return `${cleanBase}${loginPath}?returnUrl=${encodeURIComponent(returnUrl)}`;
}
