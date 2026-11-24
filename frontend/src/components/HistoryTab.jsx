import React, { useState } from 'react';
import { Clock, EyeOff, FileAudio2, Info, RefreshCw } from 'lucide-react';
import { apiRequest } from '../services/apiClient';

export default function HistoryTab({
  demoMode,
  apiBaseUrl,
  historial,
  onReloadHistorial,
  onHideDemoItem,
  showToast,
}) {
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    await onReloadHistorial();
    setLoading(false);
  };

  const handleHide = async (item) => {
    if (demoMode) {
      onHideDemoItem(item.id);
      if (selectedDetail?.id === item.id) setSelectedDetail(null);
      showToast('Audio ocultado del historial (eliminación lógica).');
      return;
    }

    const res = await apiRequest(`/api/HistorialAudios/${item.id}`, {
      method: 'DELETE',
      baseUrl: apiBaseUrl,
    });

    if (res.ok) {
      if (selectedDetail?.id === item.id) setSelectedDetail(null);
      await onReloadHistorial();
      showToast('Registro ocultado lógicamente en el backend (Visible = false).');
    } else {
      showToast(`No se pudo ocultar el registro (HTTP ${res.status}).`, 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Historial de Audios</h2>
          <p className="section-subtitle">
            Registros visibles desde <span className="mono">GET /api/HistorialAudios</span> con
            eliminación lógica (<span className="mono">DELETE /api/HistorialAudios/&#123;id&#125;</span>).
          </p>
        </div>
        <button type="button" className="btn btn-ghost btn-sm" onClick={handleRefresh} disabled={loading}>
          <RefreshCw size={14} />
          {loading ? 'Actualizando...' : 'Actualizar lista'}
        </button>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        {historial.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)' }}>
            <FileAudio2 size={32} style={{ opacity: 0.5, marginBottom: 10 }} />
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              No hay registros visibles en tu historial
            </div>
            <p style={{ fontSize: '0.84rem', margin: '6px 0 0' }}>
              Genera un audio desde el Estudio de Voz o crea registros desde la API.
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="vox-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Archivo de Audio</th>
                  <th>Fecha de Registro</th>
                  <th>Detalles</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {historial.map((item) => {
                  const audio = item.audio || {};
                  const fecha = item.fechaRegistro
                    ? new Date(item.fechaRegistro).toLocaleString('es-BO', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : '—';
                  return (
                    <tr key={item.id}>
                      <td className="mono">#{item.id}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <FileAudio2 size={16} color="#22d3ee" />
                          <div>
                            <div style={{ fontWeight: 700 }}>
                              {audio.nombreArchivo || `Audio #${item.audioId}`}
                            </div>
                            <div className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {audio.rutaArchivo || '/audios/archivo.mp3'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-secondary)' }}>
                          <Clock size={13} />
                          {fecha}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          {item.voiceName && <span className="badge badge-violet">{item.voiceName}</span>}
                          {item.languageName && <span className="badge badge-cyan">{item.languageName}</span>}
                          {item.duration && <span className="badge mono">{item.duration}</span>}
                          {!item.voiceName && <span className="badge badge-emerald">Visible</span>}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedDetail(item)}
                          >
                            <Info size={14} />
                            Ver
                          </button>
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            onClick={() => handleHide(item)}
                          >
                            <EyeOff size={14} />
                            Ocultar
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedDetail && (
        <div className="glass-card" style={{ padding: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <strong style={{ fontSize: '0.96rem' }}>
              Detalles del registro #{selectedDetail.id}
            </strong>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedDetail(null)}
            >
              Cerrar
            </button>
          </div>
          <pre className="json-block">{JSON.stringify(selectedDetail, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
