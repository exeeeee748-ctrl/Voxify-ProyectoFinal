import React, { useState } from 'react';
import {
  Clock,
  Download,
  EyeOff,
  FileAudio2,
  Info,
  RefreshCw,
} from 'lucide-react';
import { apiRequest, extractErrorMessage, getAudioUrl } from '../services/apiClient';
import { formatBytes, formatDate, formatDuration, truncate } from '../utils/format';

function statusBadge(status) {
  if (status === 'Completada' || status === 'Completado') return 'badge-emerald';
  if (status === 'Fallida' || status === 'Fallido') return 'badge-rose';
  if (status === 'Procesando') return 'badge-amber';
  return 'badge-violet';
}

export default function HistoryTab({ apiBaseUrl, generaciones, onReload, showToast }) {
  const [selectedDetail, setSelectedDetail] = useState(null);
  const [loading, setLoading] = useState(false);
  const [hidingId, setHidingId] = useState(null);
  const [showHidden, setShowHidden] = useState(false);

  const ocultosCount = generaciones.filter((item) => item.audio?.estado === 'Oculto').length;
  const generacionesVisibles = showHidden
    ? generaciones
    : generaciones.filter((item) => item.audio?.estado !== 'Oculto');

  const handleRefresh = async () => {
    setLoading(true);
    await onReload();
    setLoading(false);
  };

  const handleHide = async (generacion) => {
    if (!generacion.idAudio) {
      showToast('Esta generación no tiene un audio asociado.', 'error');
      return;
    }

    setHidingId(generacion.idAudio);
    const res = await apiRequest(`/api/audios/${generacion.idAudio}`, {
      method: 'DELETE',
      baseUrl: apiBaseUrl,
    });
    setHidingId(null);

    if (res.ok) {
      if (selectedDetail?.id === generacion.id) setSelectedDetail(null);
      await onReload();
      showToast('Audio ocultado correctamente (Estado = Oculto).');
    } else {
      showToast(extractErrorMessage(res, 'No se pudo ocultar el audio.'), 'error');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Historial de Audios</h2>
          <p className="section-subtitle">
            Generaciones del usuario desde{' '}
            <span className="mono">GET /api/usuarios/me/generaciones</span>, con reproducción y
            descarga desde <span className="mono">/api/audios/&#123;id&#125;</span>.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {ocultosCount > 0 && (
            <button
              type="button"
              className={`badge ${showHidden ? 'badge-amber' : ''}`}
              style={{ cursor: 'pointer' }}
              onClick={() => setShowHidden((value) => !value)}
            >
              {showHidden ? 'Ocultar registros ocultos' : `Mostrar ocultos (${ocultosCount})`}
            </button>
          )}
          <button type="button" className="btn btn-ghost btn-sm" onClick={handleRefresh} disabled={loading}>
            <RefreshCw size={14} />
            {loading ? 'Actualizando...' : 'Actualizar lista'}
          </button>
        </div>
      </div>

      <div className="glass-card" style={{ padding: 20 }}>
        {generacionesVisibles.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 16px', color: 'var(--text-secondary)' }}>
            <FileAudio2 size={32} style={{ opacity: 0.5, marginBottom: 10 }} />
            <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>
              {generaciones.length === 0
                ? 'Aún no tienes generaciones registradas'
                : 'No hay registros visibles en el historial'}
            </div>
            <p style={{ fontSize: '0.84rem', margin: '6px 0 0' }}>
              {generaciones.length === 0
                ? 'Genera un audio desde el Estudio de Voz para verlo aquí.'
                : 'Puedes mostrar los audios ocultos con el botón superior.'}
            </p>
          </div>
        ) : (
          <div className="table-wrap">
            <table className="vox-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Texto</th>
                  <th>Voz / Idioma</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                  <th>Audio</th>
                  <th style={{ textAlign: 'right' }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {generacionesVisibles.map((generacion) => {
                  const audio = generacion.audio;
                  const oculto = audio?.estado === 'Oculto';
                  return (
                    <tr key={generacion.id}>
                      <td className="mono">#{generacion.id}</td>
                      <td style={{ maxWidth: 300 }}>
                        <div style={{ fontWeight: 600 }}>{truncate(generacion.texto, 80)}</div>
                        {generacion.mensajeError && (
                          <div style={{ fontSize: '0.74rem', color: 'var(--rose)', marginTop: 2 }}>
                            {generacion.mensajeError}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <span className="badge badge-violet">
                            {generacion.nombreVoz || `Voz #${generacion.idVoz}`}
                          </span>
                          <span className="badge badge-cyan">
                            {generacion.nombreIdioma || `Idioma #${generacion.idIdioma}`}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            color: 'var(--text-secondary)',
                            fontSize: '0.8rem',
                          }}
                        >
                          <Clock size={13} />
                          {formatDate(generacion.fechaSolicitud)}
                        </span>
                      </td>
                      <td>
                        <span className={`badge ${statusBadge(generacion.estado)}`}>
                          {generacion.estado || 'Sin estado'}
                        </span>
                      </td>
                      <td>
                        {audio ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <audio
                              className="audio-inline"
                              controls
                              preload="none"
                              src={getAudioUrl(audio.id, 'reproducir', apiBaseUrl)}
                            />
                            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {formatDuration(audio.duracionSegundos)} · {formatBytes(audio.tamanoBytes)} ·{' '}
                              {oculto ? 'Oculto' : audio.estado || 'Disponible'}
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin audio</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: 8 }}>
                          <button
                            type="button"
                            className="btn btn-ghost btn-sm"
                            onClick={() => setSelectedDetail(generacion)}
                          >
                            <Info size={14} />
                            Ver
                          </button>
                          {audio && (
                            <a
                              className="btn btn-ghost btn-sm"
                              href={getAudioUrl(audio.id, 'descargar', apiBaseUrl)}
                              target="_blank"
                              rel="noopener noreferrer"
                              style={{ textDecoration: 'none' }}
                            >
                              <Download size={14} />
                              Descargar
                            </a>
                          )}
                          <button
                            type="button"
                            className="btn btn-danger btn-sm"
                            disabled={!audio || oculto || hidingId === audio?.id}
                            onClick={() => handleHide(generacion)}
                          >
                            <EyeOff size={14} />
                            {oculto ? 'Oculto' : hidingId === audio?.id ? 'Ocultando...' : 'Ocultar'}
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
              Detalles de la generación #{selectedDetail.id}
            </strong>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => setSelectedDetail(null)}
            >
              Cerrar
            </button>
          </div>
          <pre className="json-block">
            {JSON.stringify(
              {
                solicitud: selectedDetail.raw ?? selectedDetail,
                audio: selectedDetail.audio?.raw ?? selectedDetail.audio,
              },
              null,
              2
            )}
          </pre>
        </div>
      )}
    </div>
  );
}
