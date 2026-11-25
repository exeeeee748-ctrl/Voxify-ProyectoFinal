import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Database,
  KeyRound,
  Link2,
  LogOut,
  Mail,
  Play,
  RefreshCw,
  Save,
  Server,
  ShieldCheck,
  UserCheck,
  XCircle,
} from 'lucide-react';
import { API_ENDPOINTS, AUTH_PROVIDERS } from '../config/voxifyConfig';
import {
  apiRequest,
  buildProviderLoginUrl,
  extractErrorMessage,
  normalizeUser,
} from '../services/apiClient';
import { ProviderIcon } from './BrandMark';

const RELEASE_PRESETS = [
  { label: 'Dev (.NET 5173)', url: 'http://localhost:5173' },
  { label: 'Instancia 1 (:5001)', url: 'http://localhost:5001' },
  { label: 'Instancia 2 (:5002)', url: 'http://localhost:5002' },
  { label: 'Instancia 3 (:5003)', url: 'http://localhost:5003' },
  { label: 'Instancia 4 (:5004)', url: 'http://localhost:5004' },
];

export default function SecurityTab({ user, apiBaseUrl, onApiBaseUrlChange, onUserUpdated, onLogout, showToast }) {
  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [probeMap, setProbeMap] = useState({});
  const [testingId, setTestingId] = useState(null);
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [correo, setCorreo] = useState(user?.correo || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [sessionsData, setSessionsData] = useState({ activas: 0, sesiones: [] });
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingId, setRevokingId] = useState(null);
  const [providers, setProviders] = useState(
    () => AUTH_PROVIDERS.map((provider) => ({ ...provider, configured: null }))
  );

  const loadSessions = async () => {
    setLoadingSessions(true);
    const res = await apiRequest('/api/auth/sesiones', { baseUrl: apiBaseUrl });
    setLoadingSessions(false);
    if (res.ok && res.data) {
      setSessionsData({
        activas: res.data.activas ?? 0,
        sesiones: Array.isArray(res.data.sesiones) ? res.data.sesiones : [],
      });
    }
  };

  useEffect(() => {
    loadSessions();
  }, [apiBaseUrl]);

  const handleRevokeSession = async (sessionItem) => {
    setRevokingId(sessionItem.idSesion);
    const res = await apiRequest(`/api/auth/sesiones/${sessionItem.idSesion}`, {
      method: 'DELETE',
      baseUrl: apiBaseUrl,
    });
    setRevokingId(null);

    if (!res.ok) {
      showToast(extractErrorMessage(res, 'No se pudo revocar la sesión.'), 'error');
      return;
    }

    if (sessionItem.esActual) {
      await onLogout?.();
      return;
    }

    showToast('Sesión revocada en PostgreSQL.');
    await loadSessions();
  };

  useEffect(() => {
    setNombre(user?.nombre || '');
    setCorreo(user?.correo || '');
  }, [user?.nombre, user?.correo]);

  useEffect(() => {
    let active = true;

    (async () => {
      const res = await apiRequest('/api/auth/providers', { baseUrl: apiBaseUrl });
      if (!active || !res.ok || !res.data) return;

      const remote = Array.isArray(res.data.providers) ? res.data.providers : [];
      setProviders(
        AUTH_PROVIDERS.map((provider) => {
          const match = remote.find((item) => item.id === provider.id);
          return { ...provider, configured: Boolean(match?.configured) };
        })
      );
    })();

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    const res = await apiRequest('/api/usuarios/me', {
      method: 'PUT',
      baseUrl: apiBaseUrl,
      body: { nombre: nombre.trim(), correo: correo.trim() },
    });
    setSavingProfile(false);

    if (!res.ok) {
      showToast(extractErrorMessage(res, 'No se pudo actualizar el perfil.'), 'error');
      return;
    }

    const updated = normalizeUser(res.data);
    if (updated) {
      onUserUpdated?.({
        ...user,
        ...updated,
        proveedor: user?.proveedor ?? updated.proveedor,
        proveedores: user?.proveedores ?? updated.proveedores,
      });
    }
    showToast('Perfil actualizado en el backend .NET.');
  };

  const isProviderLinked = (providerId) =>
    (user?.proveedores || []).some(
      (item) => String(item).toLowerCase() === providerId.toLowerCase()
    );

  const handleLinkProvider = (provider) => {
    if (provider.configured === false) return;
    window.location.href = buildProviderLoginUrl(
      provider.loginPath,
      apiBaseUrl,
      `${window.location.origin}/sesion`
    );
  };

  const applyUrl = (url) => {
    setUrlInput(url);
    onApiBaseUrlChange(url);
    showToast(`Backend activo actualizado a ${url}`);
  };

  const probeEndpoint = async (endpoint) => {
    setTestingId(endpoint.id);
    const res = await apiRequest(endpoint.path, {
      method: endpoint.method,
      baseUrl: apiBaseUrl,
    });
    setProbeMap((prev) => ({ ...prev, [endpoint.id]: res }));
    setTestingId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Mi Cuenta y API</h2>
          <p className="section-subtitle">
            Identidad resuelta por <span className="mono">GET /api/auth/me</span>, proveedores
            vinculados, configuración del backend y comprobación en vivo de los recursos.
          </p>
        </div>
      </div>

      {/* Identity + Instance Switcher */}
      <div className="studio-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <KeyRound size={16} color="#22d3ee" />
              Identidad actual
            </span>
            <span className="badge badge-emerald">
              <ShieldCheck size={12} />
              {user?.estado || 'Activo'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, background: 'rgba(7, 11, 22, 0.7)', border: '1px solid var(--border-subtle)' }}>
            <div className="provider-icon-box">
              <UserCheck size={22} color="#22d3ee" />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.nombre}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                ID: <span className="mono">{user?.identificador}</span> · {user?.proveedor}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
            <Mail size={14} color="#818cf8" />
            <span className="mono">{user?.correo || 'Sin correo'}</span>
          </div>

          <pre className="json-block">
            {JSON.stringify(
              {
                idUsuario: user?.idUsuario,
                nombre: user?.nombre,
                correo: user?.correo,
                estado: user?.estado,
                proveedor: user?.proveedor,
              },
              null,
              2
            )}
          </pre>

          <form
            onSubmit={handleSaveProfile}
            style={{ display: 'flex', flexDirection: 'column', gap: 8 }}
          >
            <div className="field-label">Editar perfil</div>
            <input
              className="input"
              value={nombre}
              onChange={(event) => setNombre(event.target.value)}
              placeholder="Nombre"
            />
            <input
              className="input mono"
              type="email"
              value={correo}
              onChange={(event) => setCorreo(event.target.value)}
              placeholder="correo@dominio.com"
            />
            <button type="submit" className="btn btn-primary btn-sm" disabled={savingProfile}>
              <Save size={14} />
              {savingProfile ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </form>
        </div>

        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Server size={16} color="#c084fc" />
            Servidor Backend .NET
          </div>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Cambia la URL destino para validar el backend local o probar las instancias del release.
            El frontend guarda la elección en <span className="mono">localStorage</span>.
          </p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              applyUrl(urlInput);
            }}
            style={{ display: 'flex', gap: 8 }}
          >
            <input
              className="input mono"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://localhost:5173"
            />
            <button type="submit" className="btn btn-primary btn-sm">
              Aplicar
            </button>
          </form>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {RELEASE_PRESETS.map((preset) => (
              <button
                key={preset.url}
                type="button"
                className={`badge ${apiBaseUrl === preset.url ? 'badge-cyan' : ''}`}
                style={{ cursor: 'pointer', padding: '6px 10px' }}
                onClick={() => applyUrl(preset.url)}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Linked OAuth providers */}
      <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Link2 size={16} color="#22d3ee" />
            Proveedores OAuth vinculados
          </div>
          <span className="badge mono">
            {(user?.proveedores || []).length} identidad(es)
          </span>
        </div>

        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Cada proveedor se asocia al mismo <span className="mono">idUsuario</span> interno de
          Voxify. Vincular una cuenta nueva requiere haber iniciado sesión previamente.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 10 }}>
          {providers.map((provider) => {
            const linked = isProviderLinked(provider.id);
            const configured = provider.configured !== false;

            return (
              <div
                key={provider.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 10,
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: 'rgba(7, 11, 22, 0.7)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="provider-icon-box">
                    <ProviderIcon providerId={provider.id} size={20} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{provider.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      {provider.badge}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {linked ? (
                    <span className="badge badge-emerald">
                      <CheckCircle2 size={12} />
                      Vinculado
                    </span>
                  ) : (
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      disabled={!configured}
                      onClick={() => handleLinkProvider(provider)}
                      title={
                        configured
                          ? `Vincular ${provider.name} a tu cuenta`
                          : 'Proveedor no configurado en el backend'
                      }
                    >
                      <Link2 size={13} />
                      {configured ? 'Vincular' : 'Sin configurar'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {user?.proveedor && (
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            Sesión actual emitida por <span className="mono">{user.proveedor}</span>.
          </div>
        )}
      </div>

      {/* Single Sign-Out PostgreSQL sessions */}
      <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Database size={16} color="#22d3ee" />
            Sesiones en PostgreSQL · Single Sign-Out
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-emerald mono">
              {sessionsData.activas} activa(s)
            </span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={loadingSessions}
              onClick={loadSessions}
            >
              <RefreshCw size={13} />
              {loadingSessions ? 'Actualizando...' : 'Actualizar'}
            </button>
            <button
              type="button"
              className="btn btn-sm"
              style={{
                background: 'rgba(244, 63, 94, 0.16)',
                border: '1px solid rgba(244, 63, 94, 0.45)',
                color: '#fda4af',
              }}
              onClick={() => onLogout?.()}
            >
              <LogOut size={13} />
              Single Sign-Out global
            </button>
          </div>
        </div>

        <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          Cada inicio de sesión se registra en la tabla <span className="mono">SesionesUsuario</span> de
          PostgreSQL y se valida en cada petición. Al ejecutar <strong>Single Sign-Out global</strong>, todas
          las cookies activas en otros navegadores o instancias (<span className="mono">5001–5004</span>) quedan
          revocadas inmediatamente con <span className="mono">401 Unauthorized</span>.
        </p>

        <div className="table-wrap">
          <table className="vox-table">
            <thead>
              <tr>
                <th>Sesión</th>
                <th>Proveedor</th>
                <th>Estado</th>
                <th>Inicio</th>
                <th>Motivo / Revocación</th>
                <th style={{ textAlign: 'right' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {sessionsData.sesiones.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 14 }}>
                    No hay sesiones registradas todavía.
                  </td>
                </tr>
              ) : (
                sessionsData.sesiones.map((s) => (
                  <tr key={s.idSesion}>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                      {String(s.idSesion).slice(0, 8)}…
                      {s.esActual && (
                        <span className="badge badge-cyan" style={{ marginLeft: 6 }}>
                          Actual
                        </span>
                      )}
                    </td>
                    <td style={{ textTransform: 'capitalize' }}>{s.proveedor}</td>
                    <td>
                      <span className={`badge ${s.activa ? 'badge-emerald' : 'badge-rose'}`}>
                        {s.activa ? 'Activa' : 'Revocada'}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {s.fechaCreacion ? new Date(s.fechaCreacion).toLocaleString() : '—'}
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.8rem' }}>
                      {s.activa ? 'Vigente' : s.motivoRevocacion || 'Revocada'}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {s.activa ? (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={revokingId === s.idSesion}
                          onClick={() => handleRevokeSession(s)}
                        >
                          {revokingId === s.idSesion ? 'Revocando...' : 'Revocar'}
                        </button>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>Cerrada</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Endpoint matrix */}
      <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem' }}>
          Comprobación de Recursos del Estudio
        </div>

        <div className="table-wrap">
          <table className="vox-table">
            <thead>
              <tr>
                <th>Endpoint</th>
                <th>Descripción</th>
                <th>Último resultado</th>
                <th style={{ textAlign: 'right' }}>Pruebas</th>
              </tr>
            </thead>
            <tbody>
              {API_ENDPOINTS.map((endpoint) => {
                const res = probeMap[endpoint.id];
                const busy = testingId === endpoint.id;
                return (
                  <tr key={endpoint.id}>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge badge-cyan" style={{ marginRight: 8 }}>
                        {endpoint.method}
                      </span>
                      {endpoint.path}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{endpoint.description}</td>
                    <td>
                      {res ? (
                        <span
                          className={`badge ${
                            res.ok
                              ? 'badge-emerald'
                              : res.status === 401 || res.status === 403
                                ? 'badge-amber'
                                : 'badge-rose'
                          }`}
                        >
                          {res.ok ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                          HTTP {res.status || 'ERR'} · {res.elapsedMs}ms
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin probar</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <button
                        type="button"
                        className="btn btn-ghost btn-sm"
                        disabled={busy}
                        onClick={() => probeEndpoint(endpoint)}
                      >
                        <Play size={12} />
                        {busy ? 'Probando...' : 'Probar'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
