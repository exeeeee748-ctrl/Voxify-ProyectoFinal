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
  RefreshCw,
  Sparkles,
  Star,
  Upload,
  Volume2,
} from 'lucide-react';
import {
  apiRequest,
  extractErrorMessage,
  getAudioUrl,
  normalizeAudio,
} from '../services/apiClient';
import { formatDuration } from '../utils/format';
import VoiceWaveformCanvas from './VoiceWaveformCanvas';

const MAX_CHARS = 1500;

export default function VoiceStudioTab({
  apiBaseUrl,
  idiomas,
  voices,
  selectedVoiceId,
  selectedLangId,
  favoriteVoices,
  onSelectVoice,
  onSelectLang,
  onToggleFavoriteVoice,
  onReloadCatalog,
  onAudioGenerated,
  showToast,
}) {
  const [text, setText] = useState(
    'Bienvenido a Voxify. Esta plataforma convierte tu texto en voz natural utilizando el motor Kitten TTS 2.'
  );
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [playProgress, setPlayProgress] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [synthesisSpeed, setSynthesisSpeed] = useState(1.0);
  const [audioFormat, setAudioFormat] = useState('wav');
  const [generatedItem, setGeneratedItem] = useState(null);
  const [reloading, setReloading] = useState(false);
  const fileInputRef = useRef(null);
  const audioRef = useRef(null);

  const selectedVoice =
    voices.find((voice) => String(voice.id) === String(selectedVoiceId)) || voices[0] || null;
  const selectedLang =
    idiomas.find((idioma) => String(idioma.id) === String(selectedLangId)) || idiomas[0] || null;

  const charCount = text.length;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
  const overLimit = charCount > MAX_CHARS;

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const stopPlayback = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    setIsSpeaking(false);
  };

  const startPlayback = (item, rate = playbackRate) => {
    if (!item?.audioId) return;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }

    const audio = new Audio(getAudioUrl(item.audioId, 'reproducir', apiBaseUrl));
    audio.playbackRate = rate;
    audio.preload = 'auto';

    audio.ontimeupdate = () => {
      if (audio.duration && Number.isFinite(audio.duration)) {
        setPlayProgress(Math.min(100, Math.round((audio.currentTime / audio.duration) * 100)));
      }
    };
    audio.onended = () => {
      setPlayProgress(100);
      setIsSpeaking(false);
    };
    audio.onpause = () => setIsSpeaking(false);
    audio.onplay = () => setIsSpeaking(true);
    audio.onerror = () => {
      setIsSpeaking(false);
      showToast('No se pudo reproducir el audio desde el backend.', 'error');
    };

    audioRef.current = audio;
    audio.play().catch(() => {
      setIsSpeaking(false);
      showToast('El navegador bloqueó la reproducción automática. Pulsa reproducir.', 'error');
    });
  };

  const handlePlaybackRateChange = (event) => {
    const rate = Number(event.target.value);
    setPlaybackRate(rate);
    if (audioRef.current) audioRef.current.playbackRate = rate;
  };

  const handleTxtUpload = (event) => {
    const file = event.target.files?.[0];
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
    event.target.value = '';
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
    if (!selectedVoice) {
      showToast('No hay voces cargadas en el backend. Revisa el catálogo.', 'error');
      return;
    }
    if (!selectedLang) {
      showToast('No hay idiomas cargados en el backend. Revisa el catálogo.', 'error');
      return;
    }

    setGenerating(true);
    stopPlayback();
    setPlayProgress(0);

    const creacion = await apiRequest('/api/generaciones', {
      method: 'POST',
      baseUrl: apiBaseUrl,
      body: {
        texto: text.trim(),
        idVoz: Number(selectedVoice.id),
        idIdioma: Number(selectedLang.id),
      },
    });

    if (!creacion.ok) {
      setGenerating(false);
      showToast(extractErrorMessage(creacion, 'No se pudo registrar la solicitud de generación.'), 'error');
      return;
    }

    const solicitud = creacion.data;
    const idSolicitud = solicitud?.idSolicitudGeneracion ?? solicitud?.IdSolicitudGeneracion;

    const sintesis = await apiRequest(`/api/generaciones/${idSolicitud}/sintetizar`, {
      method: 'POST',
      baseUrl: apiBaseUrl,
      body: {
        formato: audioFormat,
        velocidad: Number(synthesisSpeed),
      },
    });

    setGenerating(false);

    if (!sintesis.ok) {
      showToast(extractErrorMessage(sintesis, 'El microservicio TTS no pudo generar el audio.'), 'error');
      onAudioGenerated?.();
      return;
    }

    const audio = normalizeAudio(sintesis.data);
    if (!audio) {
      showToast('El backend devolvió un audio inválido.', 'error');
      return;
    }

    const item = {
      id: audio.id,
      audioId: audio.id,
      nombreArchivo: audio.nombreArchivo,
      texto: text.trim(),
      voiceName: selectedVoice.name,
      voiceType: selectedVoice.type,
      languageName: selectedLang.nombre,
      languageCode: selectedLang.codigo,
      durationSeconds: audio.duracionSegundos,
      duration: formatDuration(audio.duracionSegundos),
      fechaCreacion: audio.fechaCreacion,
    };

    setGeneratedItem(item);
    setPlayProgress(0);
    onAudioGenerated?.(item);
    showToast('Audio generado y registrado en el backend .NET.');
    startPlayback(item);
  };

  const handleDownloadAudio = () => {
    if (!generatedItem?.audioId) return;
    const url = getAudioUrl(generatedItem.audioId, 'descargar', apiBaseUrl);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.rel = 'noopener';
    anchor.click();
    showToast(`Descargando ${generatedItem.nombreArchivo || 'audio generado'}...`);
  };

  const handleRefreshCatalog = async () => {
    setReloading(true);
    await onReloadCatalog();
    setReloading(false);
    showToast('Catálogo de idiomas y voces actualizado desde el backend.');
  };

  const isFavorite = (voiceId) =>
    favoriteVoices.some((favorito) => String(favorito) === String(voiceId));

  const visibleVoices = onlyFavorites
    ? voices.filter((voice) => isFavorite(voice.id))
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
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="badge badge-cyan">
            <AudioLines size={13} />
            Voz activa: {selectedVoice?.name || 'Sin voz'}
          </span>
          <span className="badge badge-violet">{selectedVoice?.sampleLabel || 'Kitten TTS 2'}</span>
        </div>
      </div>

      {/* Live Acoustic Stage */}
      <div className="wave-showcase">
        <div className="wave-showcase-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
            <span className={`badge ${isSpeaking || generating ? 'badge-emerald' : 'badge-cyan'}`}>
              <Volume2 size={13} />
              {generating
                ? 'Sintetizando con Kitten TTS 2...'
                : isSpeaking
                  ? `Reproduciendo · ${selectedVoice?.name || 'voz activa'}`
                  : 'Estudio en espera'}
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {selectedLang ? `${selectedLang.nombre} (${selectedLang.codigo})` : 'Selecciona idioma'}
            </span>
          </div>
          <span className="mono" style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
            POST /api/generaciones
          </span>
        </div>
        <VoiceWaveformCanvas
          active={isSpeaking || generating}
          height={96}
          accentColor={selectedVoice?.accent || '#22d3ee'}
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

              <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  className="select mono"
                  style={{ width: 'auto', padding: '8px 10px', fontSize: '0.78rem' }}
                  value={audioFormat}
                  onChange={(e) => setAudioFormat(e.target.value)}
                  aria-label="Formato de salida"
                >
                  <option value="wav">WAV</option>
                  <option value="mp3">MP3</option>
                  <option value="ogg">OGG</option>
                </select>
                <select
                  className="select mono"
                  style={{ width: 'auto', padding: '8px 10px', fontSize: '0.78rem' }}
                  value={synthesisSpeed}
                  onChange={(e) => setSynthesisSpeed(Number(e.target.value))}
                  aria-label="Velocidad de síntesis"
                >
                  <option value={0.8}>0.8x</option>
                  <option value={1}>1.0x</option>
                  <option value={1.25}>1.25x</option>
                  <option value={1.5}>1.5x</option>
                </select>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={generating || overLimit || !text.trim() || !selectedVoice || !selectedLang}
                  onClick={handleGenerate}
                >
                  <Sparkles size={16} />
                  {generating ? 'Generando audio...' : 'Generar audio'}
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Audio Player */}
          {generatedItem && (
            <div className="player-bar">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{generatedItem.nombreArchivo}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                    Voz {generatedItem.voiceName} ({generatedItem.voiceType}) · {generatedItem.languageName} · Duración{' '}
                    <span className="mono">{generatedItem.duration}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <select
                    className="select mono"
                    style={{ width: 'auto', padding: '6px 10px', fontSize: '0.78rem' }}
                    value={playbackRate}
                    onChange={handlePlaybackRateChange}
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
                    else if (audioRef.current && audioRef.current.currentTime > 0 && !audioRef.current.ended) {
                      audioRef.current.play();
                    } else {
                      startPlayback(generatedItem);
                    }
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
                Idioma (PostgreSQL)
              </span>
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                onClick={handleRefreshCatalog}
                disabled={reloading}
              >
                <RefreshCw size={12} />
                {reloading ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>

            <select
              className="select"
              value={selectedLang?.id ?? ''}
              onChange={(e) => onSelectLang(e.target.value)}
            >
              {idiomas.length === 0 ? (
                <option value="">Sin idiomas cargados</option>
              ) : (
                idiomas.map((idioma) => (
                  <option key={idioma.id} value={idioma.id}>
                    {idioma.nombre} ({idioma.codigo})
                  </option>
                ))
              )}
            </select>
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
                onClick={() => setOnlyFavorites((value) => !value)}
              >
                <Star size={11} fill={onlyFavorites ? '#fbbf24' : 'none'} />
                Favoritas ({favoriteVoices.length})
              </button>
            </div>

            <div className="voice-grid">
              {visibleVoices.length === 0 ? (
                <div style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', padding: 8 }}>
                  No hay voces disponibles con este filtro.
                </div>
              ) : (
                visibleVoices.map((voice) => {
                  const isSelected = String(voice.id) === String(selectedVoice?.id);
                  const isFav = isFavorite(voice.id);
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
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavoriteVoice(voice.id);
                        }}
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
                })
              )}
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
