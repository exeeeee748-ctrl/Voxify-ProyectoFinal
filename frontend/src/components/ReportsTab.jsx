import React, { useState } from 'react';
import {
  BarChart3,
  Code2,
  Database,
  Lock,
  Play,
  ShieldAlert,
  ShieldCheck,
  Table2,
  UserCheck,
} from 'lucide-react';
import { AUTHORIZED_REPORTS } from '../config/voxifyConfig';
import { apiRequest, extractErrorMessage } from '../services/apiClient';

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

export default function ReportsTab({ user, apiBaseUrl, showToast }) {
  const [resultsByReport, setResultsByReport] = useState({});
  const [loadingMap, setLoadingMap] = useState({});
  const [viewMode, setViewMode] = useState('table');
  const [customEndpoint, setCustomEndpoint] = useState('/api/Reportes/produccion-audios');

  const executeReport = async (report, includeCredentials = true) => {
    setLoadingMap((prev) => ({ ...prev, [report.id]: true }));

    const res = await apiRequest(report.endpoint, {
      method: 'GET',
      includeCredentials,
      baseUrl: apiBaseUrl,
    });

    setResultsByReport((prev) => ({ ...prev, [report.id]: res }));
    setLoadingMap((prev) => ({ ...prev, [report.id]: false }));

    if (res.ok) {
      showToast(`Reporte consultado correctamente (HTTP ${res.status}).`);
    } else if (res.status === 401) {
      showToast('El reporte requiere una sesión con rol AnalistaReportes (OAuth diferido).', 'error');
    } else if (res.status === 403) {
      showToast('Acceso denegado: falta el permiso reportes:produccion:leer.', 'error');
    } else {
      showToast(extractErrorMessage(res, `Respuesta HTTP ${res.status || 'sin conexión'}.`), 'error');
    }
  };

  const runCustomReport = async (includeCredentials) => {
    const synthetic = {
      id: 'custom',
      endpoint: customEndpoint.trim() || '/api/Reportes/produccion-audios',
    };
    await executeReport(synthetic, includeCredentials);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Reportes Autorizados</h2>
          <p className="section-subtitle">
            La autorización se valida en el backend .NET mediante la política{' '}
            <span className="mono">ReporteProduccionAudios</span>. Mientras OAuth está diferido, la
            consulta devolverá <span className="mono">401</span>.
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
          <span style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>Usuario actual:</span>
          <span className="badge badge-violet">{user?.nombre || 'Usuario de desarrollo'}</span>
          <span className="badge badge-cyan mono">{user?.correo || 'dev@voxify.local'}</span>
          <span className="badge">Rol: {user?.rol || 'Usuario'}</span>
        </div>
        <span style={{ fontSize: '0.77rem', color: 'var(--text-muted)' }}>
          El rol <span className="mono">AnalistaReportes</span> se habilita al integrar OAuth.
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
                  onClick={() => executeReport(report, true)}
                >
                  <Play size={14} />
                  {isLoading ? 'Consultando...' : 'Consultar reporte'}
                </button>
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  disabled={isLoading}
                  onClick={() => executeReport(report, false)}
                >
                  <ShieldAlert size={14} />
                  Sin credenciales
                </button>
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
              {report.tables.map((table) => (
                <span key={table} className="badge mono">
                  {table}
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
                          ? 'Unauthorized · OAuth diferido'
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

                {!result.ok && (
                  <div
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      background: 'rgba(251, 191, 36, 0.08)',
                      border: '1px solid rgba(251, 191, 36, 0.3)',
                      fontSize: '0.84rem',
                      color: '#fde68a',
                      lineHeight: 1.55,
                    }}
                  >
                    {result.status === 401
                      ? 'El endpoint está protegido por la política ReporteProduccionAudios. Al habilitar OAuth, un usuario con rol AnalistaReportes podrá consultarlo.'
                      : result.status === 403
                        ? 'El usuario no tiene el permiso reportes:produccion:leer.'
                        : extractErrorMessage(result, 'No se pudo consultar el reporte.')}
                  </div>
                )}

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
                          {columns.map((column) => (
                            <th key={column}>{column}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((row, index) => (
                          <tr key={index}>
                            {columns.map((column) => (
                              <td key={column}>{formatCell(row[column])}</td>
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

      <div className="glass-card" style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>
          Probar cualquier endpoint de reporte
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
            Consultar
          </button>
          <button
            type="button"
            className="btn btn-danger btn-sm"
            onClick={() => runCustomReport(false)}
          >
            Sin credenciales
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
