import React, { useEffect, useState } from 'react';
import { CheckCircle2, KeyRound, Mail, Play, Save, Server, ShieldCheck, UserCheck, XCircle } from 'lucide-react';
import { API_ENDPOINTS } from '../config/voxifyConfig';
import { apiRequest, extractErrorMessage, normalizeUser } from '../services/apiClient';

const RELEASE_PRESETS = [
  { label: 'Dev (.NET 5173)', url: 'http://localhost:5173' },
  { label: 'Instancia 1 (:5001)', url: 'http://localhost:5001' },
  { label: 'Instancia 2 (:5002)', url: 'http://localhost:5002' },
  { label: 'Instancia 3 (:5003)', url: 'http://localhost:5003' },
  { label: 'Instancia 4 (:5004)', url: 'http://localhost:5004' },
];

export default function SecurityTab({ user, apiBaseUrl, onApiBaseUrlChange, onUserUpdated, showToast }) {
  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [probeMap, setProbeMap] = useState({});
  const [testingId, setTestingId] = useState(null);
  const [nombre, setNombre] = useState(user?.nombre || '');
  const [correo, setCorreo] = useState(user?.correo || '');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    setNombre(user?.nombre || '');
    setCorreo(user?.correo || '');
  }, [user?.nombre, user?.correo]);

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
    if (updated) onUserUpdated?.(updated);
    showToast('Perfil actualizado en el backend .NET.');
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
            Identidad resuelta por <span className="mono">GET /api/usuarios/me</span>, configuración
            del backend y comprobación en vivo de los recursos del estudio.
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
