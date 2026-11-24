import React, { useState } from 'react';
import { CheckCircle2, KeyRound, Play, Server, ShieldCheck, XCircle } from 'lucide-react';
import { PROTECTED_ENDPOINTS } from '../config/voxifyConfig';
import { apiRequest } from '../services/apiClient';
import { ProviderIcon } from './BrandMark';

const RELEASE_PRESETS = [
  { label: 'Dev (.NET 5173)', url: 'http://localhost:5173' },
  { label: 'Instancia 1 (:5001)', url: 'http://localhost:5001' },
  { label: 'Instancia 2 (:5002)', url: 'http://localhost:5002' },
  { label: 'Instancia 3 (:5003)', url: 'http://localhost:5003' },
  { label: 'Instancia 4 (:5004)', url: 'http://localhost:5004' },
];

export default function SecurityTab({
  user,
  demoMode,
  apiBaseUrl,
  onApiBaseUrlChange,
  showToast,
}) {
  const [urlInput, setUrlInput] = useState(apiBaseUrl);
  const [probeMap, setProbeMap] = useState({});
  const [testingId, setTestingId] = useState(null);

  const applyUrl = (url) => {
    setUrlInput(url);
    onApiBaseUrlChange(url);
    showToast(`Backend activo actualizado a ${url}`);
  };

  const probeEndpoint = async (ep, includeCredentials = true) => {
    setTestingId(ep.id);
    if (demoMode) {
      await new Promise((r) => setTimeout(r, 180));
      setProbeMap((prev) => ({
        ...prev,
        [ep.id]: includeCredentials
          ? { ok: true, status: 200, elapsedMs: 14, data: ep.id === 'me' ? user : { items: 3, modo: 'demo' } }
          : { ok: false, status: 401, elapsedMs: 10, data: { error: 'No autenticado (401 Unauthorized).' } },
      }));
      setTestingId(null);
      return;
    }

    const res = await apiRequest(ep.path, {
      method: ep.method,
      includeCredentials,
      baseUrl: apiBaseUrl,
    });
    setProbeMap((prev) => ({ ...prev, [ep.id]: res }));
    setTestingId(null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Identidad, Sesión y Endpoints Protegidos</h2>
          <p className="section-subtitle">
            Verifica en vivo tu sesión autenticada (<span className="mono">/api/auth/me</span>),
            cambia entre puertos de instancias del release (Punto 7) y prueba cada recurso protegido.
          </p>
        </div>
      </div>

      {/* Identity + Instance Switcher */}
      <div className="studio-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <KeyRound size={16} color="#22d3ee" />
              Identidad actual (/api/auth/me)
            </span>
            <span className="badge badge-emerald">
              <ShieldCheck size={12} />
              Autenticado
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', borderRadius: 14, background: 'rgba(7, 11, 22, 0.7)', border: '1px solid var(--border-subtle)' }}>
            <div className="provider-icon-box">
              <ProviderIcon providerId={user?.proveedor} size={22} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>{user?.nombre}</div>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                Proveedor: <strong>{user?.proveedor}</strong> · ID:{' '}
                <span className="mono">{user?.identificador}</span>
              </div>
            </div>
          </div>

          <pre className="json-block">
            {JSON.stringify(
              {
                autenticado: user?.autenticado,
                nombre: user?.nombre,
                proveedor: user?.proveedor,
                identificador: user?.identificador,
                rol: user?.rol,
                permisos: user?.permisos,
              },
              null,
              2
            )}
          </pre>
        </div>

        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <Server size={16} color="#c084fc" />
            Servidor Backend .NET (Dev / Release 4 Instancias)
          </div>
          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Cambia la URL destino para validar el backend local o probar que tu cookie de sesión es
            reconocida en las 4 instancias del Compose de release (<span className="mono">5001–5004</span>).
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

      {/* Protected endpoints matrix */}
      <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ fontWeight: 700, fontSize: '1rem' }}>
          Comprobación de Recursos Protegidos
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
              {PROTECTED_ENDPOINTS.map((ep) => {
                const res = probeMap[ep.id];
                const busy = testingId === ep.id;
                return (
                  <tr key={ep.id}>
                    <td className="mono" style={{ whiteSpace: 'nowrap' }}>
                      <span className="badge badge-cyan" style={{ marginRight: 8 }}>
                        {ep.method}
                      </span>
                      {ep.path}
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{ep.description}</td>
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
                      <div style={{ display: 'inline-flex', gap: 8 }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          disabled={busy}
                          onClick={() => probeEndpoint(ep, true)}
                        >
                          <Play size={12} />
                          Con sesión
                        </button>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          disabled={busy}
                          onClick={() => probeEndpoint(ep, false)}
                        >
                          Sin sesión
                        </button>
                      </div>
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
