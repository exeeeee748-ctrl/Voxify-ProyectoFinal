import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  AudioLines,
  Download,
  FileText,
  Globe2,
  Mic,
  Pause,
  Play,
  Plus,
  Sparkles,
  Star,
  Upload,
  Volume2,
} from 'lucide-react';
import { apiRequest } from '../services/apiClient';
import VoiceWaveformCanvas from './VoiceWaveformCanvas';

const MAX_CHARS = 1500;

function createSampleWavBlob(durationSec = 1.6, freq = 260) {
  const sampleRate = 22050;
  const numSamples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset, str) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + numSamples * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, 'data');
  view.setUint32(40, numSamples * 2, true);

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const env = Math.sin((i / numSamples) * Math.PI);
    const val = (Math.sin(2 * Math.PI * freq * t) * 0.35 + Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.2) * env;
    view.setInt16(44 + i * 2, Math.max(-1, Math.min(1, val)) * 32767, true);
  }

  return new Blob([buffer], { type: 'audio/wav' });
}

export default function VoiceStudioTab({
  demoMode,
  apiBaseUrl,
  idiomas,
  voices,
  selectedVoiceId,
  favoriteVoices,
  onSelectVoice,
  onToggleFavoriteVoice,
  onReloadIdiomas,
  onAudioGenerated,
  showToast,
}) {
  const [text, setText] = useState(
    'Bienvenido a Voxify. Esta plataforma convierte tu texto en voz natural utilizando el motor Kitten TTS 2.'
  );
  const [selectedLangId, setSelectedLangId] = useState(() => idiomas[0]?.id || 1);
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [generatedItem, setGeneratedItem] = useState(null);
  const [showAddLang, setShowAddLang] = useState(false);
  const [newLangName, setNewLangName] = useState('');
  const [newLangCode, setNewLangCode] = useState('');
  const fileInputRef = useRef(null);
  const progressTimerRef = useRef(null);

  useEffect(() => {
    if (idiomas.length > 0 && !idiomas.some((l) => String(l.id) === String(selectedLangId))) {
      setSelectedLangId(idiomas[0].id);
    }
  }, [idiomas, selectedLangId]);

  useEffect(() => {
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const selectedVoice = voices.find((v) => v.id === selectedVoiceId) || voices[0];
  const selectedLang = idiomas.find((l) => String(l.id) === String(selectedLangId)) || idiomas[0];
  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const overLimit = charCount > MAX_CHARS;

  const toggleFavoriteVoice = (id, e) => {
    e.stopPropagation();
    onToggleFavoriteVoice(id);
  };

  const handleTxtUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.toLowerCase().endsWith('.txt')) {
      showToast('Solo se admiten archivos de texto (.txt).', 'error');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const content = String(reader.result || '');
      setText(content);
      showToast(`Archivo "${file.name}" cargado en el editor.`);
    };
    reader.onerror = () => showToast('No se pudo leer el archivo TXT.', 'error');
    reader.readAsText(file);
    e.target.value = '';
  };

  const stopPlayback = () => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const startPreviewSpeech = (spokenText, langCode, voiceCfg, rateOverride = playbackRate) => {
    stopPlayback();
    setIsSpeaking(true);
    setPlayProgress(4);

    const estimatedMs = Math.max(2200, Math.min(18000, spokenText.length * 68 / rateOverride));
    const started = Date.now();
    progressTimerRef.current = setInterval(() => {
      const pct = Math.min(99, Math.round(((Date.now() - started) / estimatedMs) * 100));
      setPlayProgress(pct);
    }, 120);

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(spokenText);
      utter.lang = langCode || 'es-ES';
      utter.pitch = voiceCfg.pitch || 1;
      utter.rate = (voiceCfg.rate || 1) * rateOverride;
      utter.onend = () => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setPlayProgress(100);
        setIsSpeaking(false);
      };
      utter.onerror = () => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setIsSpeaking(false);
      };
      window.speechSynthesis.speak(utter);
    } else {
      setTimeout(() => {
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setPlayProgress(100);
        setIsSpeaking(false);
      }, estimatedMs);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) {
      showToast('Escribe o carga un texto antes de generar el audio.', 'error');
      return;
    }
    if (overLimit) {
      showToast(`El texto supera el límite de ${MAX_CHARS} caracteres.`, 'error');
      return;
    }

    setGenerating(true);

    const fileName = `voxify_${selectedVoice.name.toLowerCase().replace(/\s+/g, '_')}_${Date.now()
      .toString()
      .slice(-4)}.wav`;

    if (!demoMode) {
      const res = await apiRequest('/api/SolicitudesGeneracion', {
        method: 'POST',
        baseUrl: apiBaseUrl,
        body: {
          texto: text.trim(),
          estado: 'Completado',
          idiomaId: Number(selectedLangId),
          activo: true,
        },
      });

      if (!res.ok) {
        setGenerating(false);
        showToast(
          res.status === 401
            ? 'Tu sesión expiró (401). Vuelve a iniciar sesión.'
            : `Error al registrar solicitud (HTTP ${res.status}).`,
          'error'
        );
        return;
      }

      const solicitudId = res.data?.id;
      if (solicitudId) {
        const audioRes = await apiRequest('/api/Audios', {
          method: 'POST',
          baseUrl: apiBaseUrl,
          body: {
            nombreArchivo: fileName,
            rutaArchivo: `/audios/${fileName}`,
            solicitudGeneracionId: solicitudId,
            activo: true,
          },
        });
        const audioId = audioRes.data?.id;
        if (audioId) {
          await apiRequest('/api/HistorialAudios', {
            method: 'POST',
            baseUrl: apiBaseUrl,
            body: {
              audioId,
              visible: true,
            },
          });
        }
      }
    }

    const durationSeconds = Math.max(3, Math.round(wordCount / 2.4));
    const item = {
      id: Date.now(),
      nombreArchivo: fileName,
      texto: text.trim(),
      voiceName: selectedVoice.name,
      voiceType: selectedVoice.type,
      languageName: selectedLang?.nombre || 'Español',
      languageCode: selectedLang?.codigo || 'es-ES',
      duration: `0:${String(durationSeconds).padStart(2, '0')}`,
      fechaCreacion: new Date().toISOString(),
    };

    setGeneratedItem(item);
    onAudioGenerated(item);
    setGenerating(false);
    showToast(
      demoMode
        ? 'Audio sintetizado en vista previa. Reproduciendo voz...'
        : 'Solicitud, Audio e Historial guardados en el backend .NET.'
    );
    startPreviewSpeech(item.texto, item.languageCode, selectedVoice);
  };

  const handleDownloadAudio = () => {
    if (!generatedItem) return;
    const blob = createSampleWavBlob(2.2, selectedVoice.pitch * 240);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = generatedItem.nombreArchivo;
    a.click();
    URL.revokeObjectURL(url);
    showToast(`Descargando ${generatedItem.nombreArchivo}...`);
  };

  const handleAddLanguage = async (e) => {
    e.preventDefault();
    if (!newLangName.trim() || !newLangCode.trim()) return;

    if (demoMode) {
      showToast(`Idioma "${newLangName}" disponible en modo real con PostgreSQL.`);
      setShowAddLang(false);
      return;
    }

    const res = await apiRequest('/api/Idiomas', {
      method: 'POST',
      baseUrl: apiBaseUrl,
      body: { nombre: newLangName.trim(), codigo: newLangCode.trim(), activo: true },
    });

    if (res.ok) {
      setNewLangName('');
      setNewLangCode('');
      setShowAddLang(false);
      await onReloadIdiomas();
      showToast('Idioma agregado al catálogo de PostgreSQL.');
    } else {
      showToast(`No se pudo crear el idioma (HTTP ${res.status}).`, 'error');
    }
  };

  const visibleVoices = onlyFavorites
    ? voices.filter((v) => favoriteVoices.includes(v.id))
    : voices;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="section-header">
        <div>
          <h2 className="section-title">Estudio de Síntesis Vocal</h2>
          <p className="section-subtitle">
            Redacta o carga un archivo <span className="mono">.txt</span>, selecciona idioma y voz
            de Kitten TTS 2 y registra la generación en tu backend.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span className="badge badge-cyan">
            <AudioLines size={13} />
            Voz activa: {selectedVoice.name}
          </span>
          <span className="badge badge-violet">{selectedVoice.sampleLabel}</span>
        </div>
      </div>

      {/* Live Acoustic Stage */}
      <div className="wave-showcase">
        <div className="wave-showcase-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className={`badge ${isSpeaking || generating ? 'badge-emerald' : 'badge-cyan'}`}>
              <Volume2 size={13} />
              {generating
                ? 'Sintetizando con Kitten TTS 2...'
                : isSpeaking
                  ? `Reproduciendo · ${selectedVoice.name}`
                  : 'Estudio en espera'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {selectedLang ? `${selectedLang.nombre} (${selectedLang.codigo})` : 'Selecciona idioma'}
            </span>
          </div>
          <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            POST /api/SolicitudesGeneracion
          </span>
        </div>
        <VoiceWaveformCanvas
          active={isSpeaking || generating}
          height={96}
          accentColor={selectedVoice.accent}
        />
      </div>

      <div className="studio-grid">
        {/* Left: Script Editor & Player */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div className="glass-card" style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <span style={{ fontWeight: 700, fontSize: '0.96rem', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                <FileText size={16} color="#22d3ee" />
                Guion de texto a voz
              </span>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,text/plain"
                  style={{ display: 'none' }}
                  onChange={handleTxtUpload}
                />
                <button
                  type="button"
                  className="btn btn-ghost btn-sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload size={14} />
                  Cargar .TXT
                </button>
              </div>
            </div>

            <textarea
              className="textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Escribe o pega aquí el texto que deseas convertir en voz..."
            />

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 14, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                <span>
                  <strong className="mono" style={{ color: 'var(--text-primary)' }}>{wordCount}</strong> palabras
                </span>
                <span style={{ color: overLimit ? 'var(--rose)' : 'var(--text-secondary)' }}>
                  <strong className="mono" style={{ color: overLimit ? 'var(--rose)' : 'var(--text-primary)' }}>
                    {charCount}
                  </strong>{' '}
                  / {MAX_CHARS} caracteres
                </span>
              </div>

              <button
                type="button"
                className="btn btn-primary"
                disabled={generating || overLimit || !text.trim()}
                onClick={handleGenerate}
              >
                <Sparkles size={16} />
                {generating ? 'Generando audio...' : 'Generar audio'}
              </button>
            </div>
          </div>

          {/* Interactive Audio Player */}
          {generatedItem && (
            <div className="player-bar">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{generatedItem.nombreArchivo}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Voz {generatedItem.voiceName} ({generatedItem.voiceType}) · {generatedItem.languageName} · Duración aprox.{' '}
                    <span className="mono">{generatedItem.duration}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    className="select mono"
                    style={{ width: 'auto', padding: '6px 10px', fontSize: '0.78rem' }}
                    value={playbackRate}
                    onChange={(e) => setPlaybackRate(Number(e.target.value))}
                    aria-label="Velocidad de reproducción"
                  >
                    <option value={0.8}>0.8x</option>
                    <option value={1}>1.0x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                  </select>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleDownloadAudio}>
                    <Download size={14} />
                    Descargar
                  </button>
                </div>
              </div>

              <div className="player-controls">
                <button
                  type="button"
                  className="play-fab"
                  onClick={() => {
                    if (isSpeaking) stopPlayback();
                    else startPreviewSpeech(generatedItem.texto, generatedItem.languageCode, selectedVoice);
                  }}
                  aria-label={isSpeaking ? 'Pausar audio' : 'Reproducir audio'}
                >
                  {isSpeaking ? <Pause size={20} /> : <Play size={20} style={{ marginLeft: 2 }} />}
                </button>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${playProgress}%` }} />
                </div>
                <span className="mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                  {playProgress}%
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Right: Language & Voice Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Language card */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div className="field-label">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Globe2 size={14} color="#22d3ee" />
                Idioma (BD PostgreSQL)
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                onClick={() => setShowAddLang((v) => !v)}
              >
                <Plus size={12} />
                Nuevo
              </button>
            </div>

            <select
              className="select"
              value={selectedLangId}
              onChange={(e) => setSelectedLangId(e.target.value)}
            >
              {idiomas.length === 0 ? (
                <option value="">Sin idiomas cargados</option>
              ) : (
                idiomas.map((lang) => (
                  <option key={lang.id} value={lang.id}>
                    {lang.nombre} ({lang.codigo})
                  </option>
                ))
              )}
            </select>

            {showAddLang && (
              <form
                onSubmit={handleAddLanguage}
                style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}
              >
                <input
                  className="input"
                  style={{ padding: '8px 10px', fontSize: '0.84rem' }}
                  placeholder="Nombre (ej. Español)"
                  value={newLangName}
                  onChange={(e) => setNewLangName(e.target.value)}
                />
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input mono"
                    style={{ padding: '8px 10px', fontSize: '0.84rem' }}
                    placeholder="Código (es-ES)"
                    value={newLangCode}
                    onChange={(e) => setNewLangCode(e.target.value)}
                  />
                  <button type="submit" className="btn btn-primary btn-sm">
                    Crear
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Voices card */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div className="field-label" style={{ marginBottom: 12 }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                <Mic size={14} color="#c084fc" />
                Voces Kitten TTS 2
              </span>
              <button
                type="button"
                className={`badge ${onlyFavorites ? 'badge-amber' : ''}`}
                style={{ cursor: 'pointer' }}
                onClick={() => setOnlyFavorites((v) => !v)}
              >
                <Star size={11} fill={onlyFavorites ? '#fbbf24' : 'none'} />
                Favoritas ({favoriteVoices.length})
              </button>
            </div>

            <div className="voice-grid">
              {visibleVoices.map((voice) => {
                const isSelected = voice.id === selectedVoiceId;
                const isFav = favoriteVoices.includes(voice.id);
                return (
                  <div
                    key={voice.id}
                    role="button"
                    tabIndex={0}
                    className={`voice-card ${isSelected ? 'selected' : ''}`}
                    onClick={() => onSelectVoice(voice.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') onSelectVoice(voice.id);
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
                        <AudioLines size={18} color={voice.accent} />
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <strong style={{ fontSize: '0.9rem' }}>{voice.name}</strong>
                          <span
                            className={`badge ${
                              voice.type === 'Clonada' ? 'badge-emerald' : 'badge-cyan'
                            }`}
                            style={{ padding: '2px 7px', fontSize: '0.66rem' }}
                          >
                            {voice.type}
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {voice.tone}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => toggleFavoriteVoice(voice.id, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 4,
                        color: isFav ? '#fbbf24' : '#64748b',
                      }}
                      title={isFav ? 'Quitar de favoritos' : 'Guardar en favoritos'}
                    >
                      <Star size={16} fill={isFav ? '#fbbf24' : 'none'} />
                    </button>
                  </div>
                );
              })}
            </div>

            <Link
              to="/voces"
              className="btn btn-ghost btn-sm"
              style={{ width: '100%', marginTop: 12, textDecoration: 'none' }}
            >
              Ver catálogo y clonar voz
              <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
