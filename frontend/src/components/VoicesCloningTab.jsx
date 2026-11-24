import React, { useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  AudioLines,
  CheckCircle2,
  Clock,
  Mic,
  Play,
  Plus,
  RefreshCw,
  Sparkles,
  Star,
  Upload,
  Wand2,
} from 'lucide-react';
import { apiUpload, extractErrorMessage } from '../services/apiClient';
import { formatDate } from '../utils/format';
import VoiceWaveformCanvas from './VoiceWaveformCanvas';

const ALLOWED_AUDIO_EXT = ['.wav', '.mp3', '.ogg', '.flac'];
const MAX_SAMPLE_MB = 10;

function statusClass(status) {
  if (status === 'Completada') return 'badge-emerald';
  if (status === 'Procesando') return 'badge-amber';
  if (status === 'Fallida') return 'badge-rose';
  return 'badge-violet';
}

export default function VoicesCloningTab({
  apiBaseUrl,
  voices,
  selectedVoiceId,
  favoriteVoices,
  clonaciones,
  onSelectVoice,
  onToggleFavoriteVoice,
  onReloadClonaciones,
  showToast,
}) {
  const navigate = useNavigate();
  const location = useLocation();
  const fileRef = useRef(null);

  const isCloneView = location.pathname.startsWith('/voces/clonar');
  const [filter, setFilter] = useState('all');
  const [cloneName, setCloneName] = useState('');
  const [sampleFile, setSampleFile] = useState(null);
  const [cloningBusy, setCloningBusy] = useState(false);

  const goToSubView = (view) => {
    navigate(view === 'clone' ? '/voces/clonar' : '/voces');
  };

  const isFavorite = (voiceId) =>
    favoriteVoices.some((favorito) => String(favorito) === String(voiceId));

  const filteredVoices = voices.filter((voice) => {
    if (filter === 'preset') return voice.type === 'Predeterminada';
    if (filter === 'cloned') return voice.type === 'Clonada';
    if (filter === 'favorites') return isFavorite(voice.id);
    return true;
  });

  const previewVoice = (voice) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(
        `Hola, soy la voz ${voice.name} de Voxify con Kitten TTS 2.`
      );
      utter.lang = 'es-ES';
      utter.pitch = voice.pitch || 1;
      utter.rate = voice.rate || 1;
      window.speechSynthesis.speak(utter);
    }
    showToast(`Reproduciendo una vista previa local de "${voice.name}".`);
  };

  const handleUseInStudio = (voiceId) => {
    onSelectVoice(voiceId);
    showToast('Voz seleccionada para el Estudio de Voz.');
    navigate('/estudio');
  };

  const handleSampleChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    const validExt = ALLOWED_AUDIO_EXT.some((ext) => lower.endsWith(ext));
    if (!validExt) {
      showToast(`Formato no admitido. Usa ${ALLOWED_AUDIO_EXT.join(', ')}.`, 'error');
      event.target.value = '';
      return;
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_SAMPLE_MB) {
      showToast(`La muestra supera el límite de ${MAX_SAMPLE_MB} MB.`, 'error');
      event.target.value = '';
      return;
    }

    setSampleFile(file);
    if (!cloneName.trim()) {
      setCloneName(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    }
    showToast(`Muestra "${file.name}" lista para enviarse al backend.`);
  };

  const handleRequestClone = async (event) => {
    event.preventDefault();
    if (!sampleFile) {
      showToast('Carga primero una grabación de muestra (0.5–30 s).', 'error');
      return;
    }
    if (!cloneName.trim()) {
      showToast('Asigna un nombre a tu voz clonada.', 'error');
      return;
    }

    setCloningBusy(true);

    const formData = new FormData();
    formData.append('nombreVoz', cloneName.trim());
    formData.append('archivo', sampleFile);

    const res = await apiUpload('/api/clonaciones', formData, { baseUrl: apiBaseUrl });

    setCloningBusy(false);

    if (!res.ok) {
      showToast(extractErrorMessage(res, 'No se pudo crear la solicitud de clonación.'), 'error');
      return;
    }

    setSampleFile(null);
    setCloneName('');
    if (fileRef.current) fileRef.current.value = '';
    await onReloadClonaciones();
    showToast('Solicitud de clonación registrada en estado Pendiente.');
    goToSubView('clone');
  };

  const totalVoces = voices.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Sliding Internal View Switcher */}
      <div className="subview-bar">
        <div className="subview-segmented" role="tablist" aria-label="Vistas de Voces">
          <div className={`subview-thumb ${isCloneView ? 'right' : ''}`} aria-hidden="true" />
          <button
            type="button"
            role="tab"
            aria-selected={!isCloneView}
            className={`subview-seg-btn ${!isCloneView ? 'active' : ''}`}
            onClick={() => goToSubView('list')}
          >
            <Mic size={15} />
            Lista de Voces ({totalVoces})
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={isCloneView}
            className={`subview-seg-btn ${isCloneView ? 'active' : ''}`}
            onClick={() => goToSubView('clone')}
          >
            <Wand2 size={15} />
            Clonación de Voz
          </button>
        </div>

        {!isCloneView ? (
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={() => goToSubView('clone')}
          >
            <Plus size={15} />
            Clonar nueva voz
          </button>
        ) : (
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => goToSubView('list')}
          >
            <ArrowLeft size={15} />
            Volver a la lista de voces
          </button>
        )}
      </div>

      {/* Smooth Sliding Viewport */}
      <div className="subview-viewport">
        <div className={`subview-track ${isCloneView ? 'show-clone' : ''}`}>
          {/* PANEL 1: Dedicated Voice Catalog */}
          <section
            className="subview-panel"
            style={{ display: 'flex', flexDirection: 'column', gap: 18 }}
            aria-hidden={isCloneView}
          >
            <div className="section-header">
              <div>
                <h2 className="section-title">Catálogo de Voces Disponibles</h2>
                <p className="section-subtitle">
                  Explora voces predeterminadas y tus voces clonadas, administra favoritas en el
                  backend y selecciona la voz activa para el estudio.
                </p>
              </div>

              <div className="nav-tabs">
                {[
                  { id: 'all', label: `Todas (${totalVoces})` },
                  { id: 'preset', label: 'Predeterminadas' },
                  { id: 'cloned', label: 'Clonadas' },
                  { id: 'favorites', label: `Favoritas (${favoriteVoices.length})` },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`nav-tab ${filter === item.id ? 'active' : ''}`}
                    onClick={() => setFilter(item.id)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="voices-catalog-grid">
              {filteredVoices.length === 0 ? (
                <div className="glass-card" style={{ padding: 22, color: 'var(--text-secondary)' }}>
                  No hay voces disponibles con este filtro. El catálogo se carga desde{' '}
                  <span className="mono">GET /api/voces</span>.
                </div>
              ) : (
                filteredVoices.map((voice) => {
                  const isSelected = String(voice.id) === String(selectedVoiceId);
                  const isFav = isFavorite(voice.id);
                  return (
                    <article
                      key={voice.id}
                      className={`voice-catalog-card ${isSelected ? 'selected' : ''}`}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            className="voice-orb"
                            style={{
                              background: `${voice.accent}22`,
                              border: `1px solid ${voice.accent}55`,
                            }}
                          >
                            <AudioLines size={19} color={voice.accent} />
                          </div>
                          <div>
                            <strong style={{ fontSize: '1rem' }}>{voice.name}</strong>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                              {voice.tone}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => onToggleFavoriteVoice(voice.id)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            padding: 4,
                            color: isFav ? '#fbbf24' : '#64748b',
                          }}
                          title={isFav ? 'Quitar de favoritos' : 'Marcar favorita'}
                        >
                          <Star size={18} fill={isFav ? '#fbbf24' : 'none'} />
                        </button>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span
                          className={`badge ${
                            voice.type === 'Clonada' ? 'badge-emerald' : 'badge-cyan'
                          }`}
                        >
                          {voice.type}
                        </span>
                        <span className="badge mono">{voice.sampleLabel}</span>
                        {voice.languages?.length > 0 && (
                          <span className="badge mono">{voice.languages.join(' · ')}</span>
                        )}
                        {isSelected && <span className="badge badge-violet">Activa</span>}
                      </div>

                      <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => previewVoice(voice)}
                        >
                          <Play size={14} />
                          Probar
                        </button>
                        <button
                          type="button"
                          className="btn btn-primary btn-sm"
                          style={{ flex: 1 }}
                          onClick={() => handleUseInStudio(voice.id)}
                        >
                          Usar en Estudio
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </section>

          {/* PANEL 2: Dedicated Voice Cloning Internal View */}
          <section
            className="subview-panel"
            style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
            aria-hidden={!isCloneView}
          >
            <div className="section-header">
              <div>
                <h2 className="section-title">Laboratorio de Clonación de Voz</h2>
                <p className="section-subtitle">
                  Sube tu muestra de referencia, registra la solicitud en el backend .NET y
                  monitorea su estado en PostgreSQL.
                </p>
              </div>
              <span className="badge badge-emerald">Kitten TTS 2 · Muestra 0.5–30 s</span>
            </div>

            <div className="wave-showcase">
              <div className="wave-showcase-header">
                <span className={`badge ${cloningBusy ? 'badge-emerald' : 'badge-violet'}`}>
                  <Wand2 size={13} />
                  {cloningBusy
                    ? 'Enviando muestra al backend...'
                    : sampleFile
                      ? `Muestra lista: ${sampleFile.name}`
                      : 'Esperando grabación de referencia'}
                </span>
                <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                  WAV · MP3 · OGG · FLAC · máx. {MAX_SAMPLE_MB} MB
                </span>
              </div>
              <VoiceWaveformCanvas active={cloningBusy || Boolean(sampleFile)} height={84} accentColor="#34d399" />
            </div>

            <div className="studio-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <form
                onSubmit={handleRequestClone}
                className="glass-card"
                style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <strong style={{ fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                  <Upload size={16} color="#22d3ee" />
                  Nueva solicitud de clonación
                </strong>

                <input
                  ref={fileRef}
                  type="file"
                  accept=".wav,.mp3,.ogg,.flac,audio/*"
                  style={{ display: 'none' }}
                  onChange={handleSampleChange}
                />

                <div
                  role="button"
                  tabIndex={0}
                  className="upload-dropzone"
                  onClick={() => fileRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') fileRef.current?.click();
                  }}
                >
                  <Upload size={24} color="#22d3ee" />
                  <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>
                    {sampleFile ? sampleFile.name : 'Haz clic para cargar tu muestra de voz'}
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                    {sampleFile
                      ? `${(sampleFile.size / (1024 * 1024)).toFixed(2)} MB · Lista para enviar`
                      : 'Selecciona una grabación con voz clara y sin música de fondo'}
                  </div>
                </div>

                <div>
                  <div className="field-label">Nombre de la voz</div>
                  <input
                    className="input"
                    placeholder="Ej. Voz Narrador Pro"
                    value={cloneName}
                    onChange={(e) => setCloneName(e.target.value)}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={cloningBusy}>
                  <Sparkles size={16} />
                  {cloningBusy ? 'Registrando solicitud...' : 'Solicitar clonación de voz'}
                </button>

                <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                  El backend crea la <span className="mono">SolicitudClonacion</span> y guarda la
                  muestra en <span className="mono">MuestraVoz</span>. La voz aparecerá en el
                  catálogo cuando el proceso de clonación finalice.
                </div>
              </form>

              <div
                className="glass-card"
                style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <strong style={{ fontSize: '1rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <Mic size={16} color="#c084fc" />
                    Mis solicitudes de clonación
                  </strong>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="badge mono">{clonaciones.length} registros</span>
                    <button
                      type="button"
                      className="btn btn-ghost btn-sm"
                      onClick={onReloadClonaciones}
                      title="Actualizar solicitudes"
                    >
                      <RefreshCw size={13} />
                    </button>
                  </div>
                </div>

                <div className="table-wrap">
                  <table className="vox-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Voz</th>
                        <th>Muestra</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clonaciones.length === 0 ? (
                        <tr>
                          <td colSpan={5} style={{ color: 'var(--text-secondary)' }}>
                            Aún no hay solicitudes de clonación.
                          </td>
                        </tr>
                      ) : (
                        clonaciones.map((request) => (
                          <tr key={request.id}>
                            <td className="mono">#{request.id}</td>
                            <td style={{ fontWeight: 700 }}>{request.voiceName}</td>
                            <td
                              className="mono"
                              style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}
                            >
                              {request.idMuestra ? `Muestra #${request.idMuestra}` : '—'}
                            </td>
                            <td style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                              {formatDate(request.createdAt)}
                            </td>
                            <td>
                              <span className={`badge ${statusClass(request.status)}`}>
                                {request.status === 'Completada' ? (
                                  <CheckCircle2 size={12} />
                                ) : (
                                  <Clock size={12} />
                                )}
                                {request.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div
                  style={{
                    marginTop: 'auto',
                    padding: '12px 14px',
                    borderRadius: 12,
                    background: 'rgba(52, 211, 153, 0.08)',
                    border: '1px solid rgba(52, 211, 153, 0.24)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                    flexWrap: 'wrap',
                    fontSize: '0.8rem',
                  }}
                >
                  <span style={{ color: 'var(--text-secondary)' }}>
                    La clonación se procesa en el microservicio FastAPI.
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => goToSubView('list')}
                  >
                    Ver catálogo
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
