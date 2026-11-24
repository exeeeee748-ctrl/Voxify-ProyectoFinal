import React, { useState } from 'react';
import {
  BarChart3,
  Code2,
  Database,
  Lock,
  Play,
  ShieldAlert,
  ShieldBan,
  ShieldCheck,
  Table2,
  UserCheck,
} from 'lucide-react';
import { AUTHORIZED_REPORTS } from '../config/voxifyConfig';
import { apiRequest } from '../services/apiClient';

function extractRows(payload) {
  if (Array.isArray(payload)) return payload;
  if (payload && typeof payload === 'object') {
    for (const key of ['datos', 'data', 'items', 'resultados', 'resumen', 'filas']) {
      if (Array.isArray(payload[key])) return payload[key];
    }
    return [payload];
  }
  return [];
}

function formatCell(value) {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'boolean') return value ? 'Sí' : 'No';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export default function ReportsTab({ user, demoMode, apiBaseUrl, showToast }) {
  const [resultsByReport, setResultsByReport] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [viewMode, setViewMode] = useState('table');
  const [customEndpoint, setCustomEndpoint] = useState('/api/Reportes/produccion-audios');

  const executeReport = async (report, mode = 'with-session') => {
    setLoadingMap((prev) => ({ ...prev, [report.id]: true }));

    if (demoMode) {
      await new Promise((r) => setTimeout(r, 220));
      if (mode === 'with-session' && report.demoPayload) {
        setResultsByReport((prev) => ({
          ...prev,
          [report.id]: {
            ok: true,
            status: 200,
            elapsedMs: 18,
            mode,
            data: report.demoPayload,
            url: `${apiBaseUrl}${report.endpoint}`,
          },
        }));
        showToast('Reporte autorizado cargado en vista previa (200 OK).');
      } else if (mode === 'demo-forbidden') {
        setResultsByReport((prev) => ({
          ...prev,
          [report.id]: {
            ok: false,
            status: 403,
            elapsedMs: 14,
            mode,
            data: {
              error: 'Acceso denegado. No tienes permisos suficientes para este recurso.',
              requerido: 'Rol AnalistaReportes + permiso reportes:produccion:leer',
            },
            url: `${apiBaseUrl}${report.endpoint}`,
          },
        }));
        showToast('Rechazo por falta de permisos: 403 Forbidden.');
      } else {
        setResultsByReport((prev) => ({
          ...prev,
          [report.id]: {
            ok: false,
            status: 401,
            elapsedMs: 12,
            mode,
            data: {
              error: 'No autenticado. Inicia sesión para acceder a este recurso.',
            },
            url: `${apiBaseUrl}${report.endpoint}`,
          },
        }));
        showToast('Rechazo sin sesión: 401 Unauthorized.');
      }
      setLoadingMap((prev) => ({ ...prev, [report.id]: false }));
      return;
    }

    const res = await apiRequest(report.endpoint, {
      method: 'GET',
      includeCredentials: mode === 'with-session',
      baseUrl: apiBaseUrl,
    });

    setResultsByReport((prev) => ({
      ...prev,
      [report.id]: { ...res, mode },
    }));
    setLoadingMap((prev) => ({ ...prev, [report.id]: false }));

    if (res.ok) {
      showToast(`Reporte consultado correctamente (HTTP ${res.status}).`);
    } else if (res.status === 401) {
      showToast('Acceso rechazado por el backend: 401 Unauthorized (sin sesión).');
    } else if (res.status === 403) {
      showToast('Acceso denegado por el backend: 403 Forbidden (sin permiso requerido).');
    } else {
      showToast(`Respuesta HTTP ${res.status || 'Sin conexión'} al consultar el reporte.`, 'error');
    }
  };

  const runCustomReport = async (includeCredentials) => {
    const synthetic = {
      id: 'custom',
      endpoint: customEndpoint.trim() || '/api/Reportes/produccion-audios',
    };
    await executeReport(synthetic, includeCredentials ? 'with-session' : 'without-session');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Reportes Autorizados por Integrante</h2>
          <p className="section-subtitle">
            Punto 2: la autorización se valida en el backend .NET. El botón siempre es visible para
            demostrar el acceso permitido (<span className="mono">200 OK</span>), sin sesión (
            <span className="mono">401</span>) y sin permisos (<span className="mono">403</span>).
          </p>
        </div>

        <div className="nav-tabs">
          <button
            type="button"
            className={`nav-tab ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <Table2 size={14} />
            Tabla
          </button>
          <button
            type="button"
            className={`nav-tab ${viewMode === 'json' ? 'active' : ''}`}
            onClick={() => setViewMode('json')}
          >
            <Code2 size={14} />
            JSON
          </button>
        </div>
      </div>

      {/* Current user authorization badge bar */}
      <div
        className="glass-panel"
        style={{
          padding: '14px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Lock size={15} color="#22d3ee" />
          <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Tu sesión actual:</span>
          <span className="badge badge-violet">Rol: {user?.rol || 'Usuario'}</span>
          {(user?.permisos || []).map((perm) => (
            <span key={perm} className="badge badge-cyan mono">
              {perm}
            </span>
          ))}
        </div>
        <span style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>
          Por defecto: Twitch → <span className="mono">AnalistaReportes (200)</span> · Microsoft →{' '}
          <span className="mono">Usuario (403)</span>
        </span>
      </div>

      {AUTHORIZED_REPORTS.map((report) => {
        const result = resultsByReport[report.id];
        const isLoading = Boolean(loadingMap[report.id]);
        const rows = result?.ok ? extractRows(result.data) : [];
        const columns = rows.length > 0 && typeof rows[0] === 'object' ? Object.keys(rows[0]) : [];
        const resumen = result?.ok ? result.data?.resumenGeneral : null;

        return (
          <article
            key={report.id}
            className="glass-card"
            style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span className="badge badge-cyan">
                    <BarChart3 size={13} />
                    Reporte Autorizado
                  </span>
                  <span className="badge badge-violet">
                    <UserCheck size={13} />
                    Autor: {report.author}
                  </span>
                  <span className="badge mono">{report.endpoint}</span>
                </div>
                <h3 style={{ margin: '4px 0 0', fontSize: '1.15rem' }}>{report.title}</h3>
                <p style={{ margin: 0, color: 'var(--text-secondary)', fontSize: '0.88rem', maxWidth: 760 }}>
                  {report.purpose}
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, flexWrap: 'wrap' }}>
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
                  disabled={isLoading}
                  onClick={() => executeReport(report, 'with-session')}
                >
                  <Play size={14} />
                  {isLoading ? 'Consultando...' : 'Consultar con sesión'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={isLoading}
                  onClick={() => executeReport(report, 'without-session')}
                >
                  <ShieldAlert size={14} />
                  Sin sesión (401)
                </button>
                {demoMode && (
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    disabled={isLoading}
                    onClick={() => executeReport(report, 'demo-forbidden')}
                  >
                    <ShieldBan size={14} />
                    Sin permiso (403)
                  </button>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: '0.76rem',
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <Database size={13} />
                Tablas:
              </span>
              {report.tables.map((t) => (
                <span key={t} className="badge mono">
                  {t}
                </span>
              ))}
              <span className="badge badge-emerald" style={{ marginLeft: 'auto' }}>
                <ShieldCheck size={12} />
                {report.authorization}
              </span>
            </div>

            {result && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    padding: '10px 14px',
                    borderRadius: 12,
                    background: 'rgba(7, 11, 22, 0.72)',
                    border: '1px solid var(--border-subtle)',
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      className={`badge ${
                        result.ok
                          ? 'badge-emerald'
                          : result.status === 401
                            ? 'badge-amber'
                            : 'badge-rose'
                      }`}
                    >
                      HTTP {result.status || 'ERR'}{' '}
                      {result.ok
                        ? 'OK · Autorizado'
                        : result.status === 401
                          ? 'Unauthorized · Sin sesión'
                          : result.status === 403
                            ? 'Forbidden · Sin permisos'
                            : ''}
                    </span>
                    <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      GET {result.url}
                    </span>
                  </div>
                  <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {result.elapsedMs} ms
                  </span>
                </div>

                {resumen && viewMode === 'table' && (
                  <div className="stats-grid">
                    <div className="stat-card">
                      <div className="stat-label">Solicitudes Activas</div>
                      <div className="stat-value mono">{resumen.totalSolicitudesActivas}</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Audios Producidos</div>
                      <div className="stat-value mono" style={{ color: 'var(--cyan)' }}>
                        {resumen.totalAudiosActivos}
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Visibles / Ocultos</div>
                      <div className="stat-value mono" style={{ fontSize: '1.25rem' }}>
                        {resumen.totalVisiblesEnHistorial}{' '}
                        <span style={{ color: 'var(--text-muted)' }}>/ {resumen.totalOcultosEnHistorial}</span>
                      </div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-label">Conversión a Audio</div>
                      <div className="stat-value mono" style={{ color: 'var(--emerald)' }}>
                        {resumen.tasaConversionPorcentaje}%
                      </div>
                    </div>
                  </div>
                )}

                {result.ok && viewMode === 'table' && columns.length > 0 ? (
                  <div className="table-wrap">
                    <table className="vox-table">
                      <thead>
                        <tr>
                          {columns.map((col) => (
                            <th key={col}>{col}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, idx) => (
                          <tr key={idx}>
                            {columns.map((col) => (
                              <td key={col}>{formatCell(row[col])}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <pre className="json-block">{JSON.stringify(result.data, null, 2)}</pre>
                )}
              </div>
            )}
          </article>
        );
      })}

      {/* Quick tester for additional team report endpoints */}
      <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>
          Probar cualquier endpoint de reporte de otro integrante
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <input
            className="input mono"
            style={{ flex: 1, minWidth: 240 }}
            value={customEndpoint}
            onChange={(e) => setCustomEndpoint(e.target.value)}
            placeholder="/api/Reportes/mi-reporte"
          />
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => runCustomReport(true)}
          >
            Consultar con sesión
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => runCustomReport(false)}
          >
            Probar sin sesión
          </button>
        </div>

        {resultsByReport.custom && (
          <pre className="json-block">
            {JSON.stringify(
              {
                status: resultsByReport.custom.status,
                url: resultsByReport.custom.url,
                elapsedMs: resultsByReport.custom.elapsedMs,
                respuesta: resultsByReport.custom.data,
              },
              null,
              2
            )}
          </pre>
        )}
      </div>
    </div>
  );
}
