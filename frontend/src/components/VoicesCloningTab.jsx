import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AudioLines,
  CheckCircle2,
  Clock,
  Mic,
  Play,
  Sparkles,
  Star,
  Upload,
  Wand2,
} from 'lucide-react';

const ALLOWED_AUDIO_EXT = ['.wav', '.mp3', '.ogg', '.m4a', '.flac'];
const MAX_SAMPLE_MB = 15;

export default function VoicesCloningTab({
  voices,
  selectedVoiceId,
  favoriteVoices,
  onSelectVoice,
  onToggleFavoriteVoice,
  onAddClonedVoice,
  showToast,
}) {
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const [filter, setFilter] = useState('all');
  const [cloneName, setCloneName] = useState('');
  const [cloneTone, setCloneTone] = useState('Zero-shot · Personalizada');
  const [sampleFile, setSampleFile] = useState(null);
  const [cloningBusy, setCloningBusy] = useState(false);
  const [requests, setRequests] = useState([
    {
      id: 'CLN-101',
      voiceName: 'Mi Voz Studio',
      sampleName: 'muestra_ezequiel_15s.wav',
      createdAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
      status: 'Completada',
    },
  ]);

  const filteredVoices = voices.filter((v) => {
    if (filter === 'preset') return v.type === 'Predeterminada';
    if (filter === 'cloned') return v.type === 'Clonada';
    if (filter === 'favorites') return favoriteVoices.includes(v.id);
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
    showToast(`Reproduciendo muestra de la voz "${voice.name}".`);
  };

  const handleUseInStudio = (voiceId) => {
    onSelectVoice(voiceId);
    showToast('Voz seleccionada para el Estudio de Voz.');
    navigate('/estudio');
  };

  const handleSampleChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const lower = file.name.toLowerCase();
    const validExt = ALLOWED_AUDIO_EXT.some((ext) => lower.endsWith(ext));
    if (!validExt) {
      showToast(`Formato no admitido. Usa ${ALLOWED_AUDIO_EXT.join(', ')}.`, 'error');
      return;
    }

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > MAX_SAMPLE_MB) {
      showToast(`La muestra supera el límite de ${MAX_SAMPLE_MB} MB.`, 'error');
      return;
    }

    setSampleFile(file);
    if (!cloneName.trim()) {
      setCloneName(file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' '));
    }
    showToast(`Muestra "${file.name}" validada y lista para clonación.`);
  };

  const handleRequestClone = async (e) => {
    e.preventDefault();
    if (!sampleFile) {
      showToast('Carga primero una grabación de muestra (5–30 s).', 'error');
      return;
    }
    if (!cloneName.trim()) {
      showToast('Asigna un nombre a tu voz clonada.', 'error');
      return;
    }

    setCloningBusy(true);
    const reqId = `CLN-${Math.floor(Math.random() * 900 + 100)}`;
    const voiceName = cloneName.trim();

    setRequests((prev) => [
      {
        id: reqId,
        voiceName,
        sampleName: sampleFile.name,
        createdAt: new Date().toISOString(),
        status: 'Procesando',
      },
      ...prev,
    ]);

    await new Promise((r) => setTimeout(r, 900));

    const newVoice = {
      id: `kitten-clone-${Date.now()}`,
      name: voiceName,
      type: 'Clonada',
      tone: cloneTone.trim() || 'Zero-shot · Personalizada',
      accent: '#34d399',
      languages: ['es', 'en'],
      pitch: 1.0,
      rate: 1.0,
      sampleLabel: 'Kitten TTS 2 · Clone',
    };

    onAddClonedVoice(newVoice);
    setRequests((prev) =>
      prev.map((item) => (item.id === reqId ? { ...item, status: 'Completada' } : item))
    );
    setSampleFile(null);
    setCloneName('');
    setCloningBusy(false);
    showToast(`Voz clonada "${voiceName}" lista para usar en el Estudio.`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Voice Catalog Section */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div className="section-header">
          <div>
            <h2 className="section-title">Catálogo de Voces</h2>
            <p className="section-subtitle">
              Explora voces predeterminadas y clonadas (Épica 4), administra favoritas y elige la
              voz activa para generar audio.
            </p>
          </div>

          <div className="nav-tabs">
            {[
              { id: 'all', label: `Todas (${voices.length})` },
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
          {filteredVoices.map((voice) => {
            const isSelected = voice.id === selectedVoiceId;
            const isFav = favoriteVoices.includes(voice.id);
            return (
              <article
                key={voice.id}
                className={`voice-catalog-card ${isSelected ? 'selected' : ''}`}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
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
                  <span className={`badge ${voice.type === 'Clonada' ? 'badge-emerald' : 'badge-cyan'}`}>
                    {voice.type}
                  </span>
                  <span className="badge mono">{voice.sampleLabel}</span>
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
          })}
        </div>
      </section>

      {/* Voice Cloning Section (Épica 5) */}
      <section className="studio-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
        <form
          onSubmit={handleRequestClone}
          className="glass-card"
          style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: '1.02rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Wand2 size={17} color="#34d399" />
              Clonación de Voz (Kitten TTS 2)
            </strong>
            <span className="badge badge-emerald">Zero-Shot · 5–30s</span>
          </div>

          <p style={{ margin: 0, fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Carga una grabación limpia de referencia (<span className="mono">.wav, .mp3, .ogg, .m4a</span>,
            máx. {MAX_SAMPLE_MB} MB) para solicitar una nueva voz clonada (HU-18 y HU-19).
          </p>

          <input
            ref={fileRef}
            type="file"
            accept=".wav,.mp3,.ogg,.m4a,.flac,audio/*"
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
            <Upload size={22} color="#22d3ee" />
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
              {sampleFile ? sampleFile.name : 'Haz clic para seleccionar una muestra de audio'}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
              {sampleFile
                ? `${(sampleFile.size / (1024 * 1024)).toFixed(2)} MB · Validada`
                : 'WAV, MP3, OGG o M4A · Recomendado 10 a 20 segundos sin ruido'}
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <div className="field-label">Nombre de la voz</div>
              <input
                className="input"
                placeholder="Ej. Voz Narrador Pro"
                value={cloneName}
                onChange={(e) => setCloneName(e.target.value)}
              />
            </div>
            <div>
              <div className="field-label">Estilo / descripción</div>
              <input
                className="input"
                value={cloneTone}
                onChange={(e) => setCloneTone(e.target.value)}
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary" disabled={cloningBusy}>
            <Sparkles size={16} />
            {cloningBusy ? 'Procesando clonación...' : 'Solicitar clonación de voz'}
          </button>
        </form>

        {/* Cloning Requests Status (HU-20) */}
        <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <strong style={{ fontSize: '1.02rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Mic size={17} color="#c084fc" />
              Estado de Solicitudes de Clonación
            </strong>
            <span className="badge mono">{requests.length} registros</span>
          </div>

          <div className="table-wrap">
            <table className="vox-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Voz</th>
                  <th>Muestra</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id}>
                    <td className="mono">{req.id}</td>
                    <td style={{ fontWeight: 700 }}>{req.voiceName}</td>
                    <td className="mono" style={{ fontSize: '0.76rem', color: 'var(--text-secondary)' }}>
                      {req.sampleName}
                    </td>
                    <td>
                      <span
                        className={`badge ${
                          req.status === 'Completada'
                            ? 'badge-emerald'
                            : req.status === 'Procesando'
                              ? 'badge-amber'
                              : 'badge-rose'
                        }`}
                      >
                        {req.status === 'Completada' ? <CheckCircle2 size={12} /> : <Clock size={12} />}
                        {req.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
