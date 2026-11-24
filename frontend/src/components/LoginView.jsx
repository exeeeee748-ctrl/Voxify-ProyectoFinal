import React, { useState } from 'react';
import {
  ArrowRight,
  AudioLines,
  CheckCircle2,
  Globe2,
  Lock,
  Server,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Waves,
} from 'lucide-react';
import { BrandMark } from './BrandMark';
import VoiceWaveformCanvas from './VoiceWaveformCanvas';

export default function LoginView({
  apiBaseUrl,
  onApiBaseUrlChange,
  onDevLogin,
  connecting,
  notice,
}) {
  const [editingApi, setEditingApi] = useState(false);
  const [apiDraft, setApiDraft] = useState(apiBaseUrl);

  const saveApiUrl = (e) => {
    e.preventDefault();
    onApiBaseUrlChange(apiDraft);
    setEditingApi(false);
  };

  return (
    <main className="login-page">
      {/* Left: Voice Studio Hero */}
      <section className="login-hero">
        <BrandMark playing />

        <div className="hero-eyebrow">
          <Sparkles size={14} />
          <span>Motor Kitten TTS 2 · Síntesis Neural Multilingüe</span>
        </div>

        <h1 className="hero-heading">
          Convierte cualquier texto en <span>voz natural</span> en segundos.
        </h1>

        <p className="hero-lead">
          Estudio web conectado al backend <span className="mono">.NET + PostgreSQL</span> de
          Voxify. En esta fase OAuth está diferido y el backend resuelve un usuario local de
          desarrollo para que puedas usar toda la aplicación.
        </p>

        <div className="wave-showcase">
          <div className="wave-showcase-header">
            <span className="badge badge-cyan">
              <AudioLines size={13} />
              Espectro Acústico en Vivo
            </span>
            <span className="mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
              48 kHz · Zero-Shot Ready
            </span>
          </div>
          <VoiceWaveformCanvas active={false} height={116} />
        </div>

        <div className="feature-pills">
          <div className="feature-pill">
            <Globe2 size={18} color="#22d3ee" />
            <div className="feature-pill-title">Catálogo de Idiomas</div>
            <p className="feature-pill-text">
              Catálogo conectado a <span className="mono">/api/idiomas</span> y persistido en
              PostgreSQL.
            </p>
          </div>
          <div className="feature-pill">
            <Waves size={18} color="#818cf8" />
            <div className="feature-pill-title">Voces y Clonación</div>
            <p className="feature-pill-text">
              Voces predeterminadas y clonadas listas para síntesis con Kitten TTS 2.
            </p>
          </div>
          <div className="feature-pill">
            <ShieldCheck size={18} color="#c084fc" />
            <div className="feature-pill-title">Acceso de Desarrollo</div>
            <p className="feature-pill-text">
              Usuario local aislado en el backend mientras se habilita OAuth en una fase futura.
            </p>
          </div>
        </div>
      </section>

      {/* Right: Connection Card */}
      <section className="glass-card login-card">
        <div className="login-card-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span className="badge badge-violet">
              <Lock size={12} />
              Conexión de desarrollo
            </span>

            {!editingApi ? (
              <button
                type="button"
                className="badge"
                style={{ cursor: 'pointer' }}
                onClick={() => {
                  setApiDraft(apiBaseUrl);
                  setEditingApi(true);
                }}
                title="Cambiar URL del backend .NET"
              >
                API: <span className="mono">{apiBaseUrl.replace(/^https?:\/\//, '')}</span>
              </button>
            ) : null}
          </div>

          {editingApi && (
            <form onSubmit={saveApiUrl} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <input
                className="input mono"
                style={{ padding: '8px 10px', fontSize: '0.8rem' }}
                value={apiDraft}
                onChange={(e) => setApiDraft(e.target.value)}
                placeholder="http://localhost:5173"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Guardar
              </button>
            </form>
          )}

          <h2 style={{ marginTop: 14 }}>Entra al estudio de voz</h2>
          <p>
            El backend .NET expone un usuario local de desarrollo en{' '}
            <span className="mono">GET /api/usuarios/me</span>. No necesitas credenciales externas.
          </p>
        </div>

        {notice && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(251, 191, 36, 0.12)',
              border: '1px solid rgba(251, 191, 36, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.84rem',
              color: '#fde68a',
            }}
          >
            <ShieldCheck size={18} style={{ flexShrink: 0 }} />
            <span>{notice}</span>
          </div>
        )}

        <div className="provider-stack">
          <button
            type="button"
            className="provider-btn provider-local"
            onClick={onDevLogin}
            disabled={connecting}
          >
            <div className="provider-left">
              <div className="provider-icon-box">
                <UserCheck size={22} color="#22d3ee" />
              </div>
              <div>
                <span className="provider-name">
                  {connecting ? 'Conectando con el backend...' : 'Entrar con usuario de desarrollo'}
                </span>
                <span className="provider-desc">dev@voxify.local · Sesión local (§1.1)</span>
              </div>
            </div>
            <ArrowRight size={18} color="#94a3b8" />
          </button>
        </div>

        <div className="probe-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Server size={15} color="#22d3ee" />
              Backend .NET
            </span>
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              /api/usuarios/me
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Al entrar se cargan idiomas, voces, favoritos, generaciones y solicitudes de clonación
            desde PostgreSQL. Puedes cambiar la URL del backend con el botón superior.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
            <CheckCircle2 size={14} color="#34d399" />
            <span style={{ color: 'var(--text-secondary)' }}>
              OAuth (Twitch / Microsoft) permanece deshabilitado por especificación.
            </span>
          </div>
        </div>
      </section>
    </main>
  );
}
