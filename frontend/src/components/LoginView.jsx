import React, { useState } from 'react';
import {
  ArrowRight,
  AudioLines,
  CheckCircle2,
  Eye,
  Globe2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Waves,
} from 'lucide-react';
import { AUTH_PROVIDERS } from '../config/voxifyConfig';
import { apiRequest, buildProviderLoginUrl } from '../services/apiClient';
import { BrandMark, ProviderIcon } from './BrandMark';
import VoiceWaveformCanvas from './VoiceWaveformCanvas';

export default function LoginView({
  apiBaseUrl,
  onApiBaseUrlChange,
  logoutNotice,
  lastLogoutProbe,
  onEnterDemoMode,
}) {
  const [probeResult, setProbeResult] = useState(lastLogoutProbe || null);
  const [probing, setProbing] = useState(false);
  const [editingApi, setEditingApi] = useState(false);
  const [apiDraft, setApiDraft] = useState(apiBaseUrl);

  const handleProviderLogin = (provider) => {
    const target = buildProviderLoginUrl(provider.loginPath, apiBaseUrl);
    window.location.href = target;
  };

  const runUnauthenticatedProbe = async (path) => {
    setProbing(true);
    const res = await apiRequest(path, {
      method: 'GET',
      includeCredentials: true,
      baseUrl: apiBaseUrl,
    });
    setProbeResult({ path, ...res });
    setProbing(false);
  };

  const saveApiUrl = (e) => {
    e.preventDefault();
    onApiBaseUrlChange(apiDraft);
    setEditingApi(false);
  };

  const displayProbe = probeResult || lastLogoutProbe;

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
          Voxify. Inicia sesión con un proveedor externo para gestionar idiomas, generar audios,
          explorar tu historial y consultar reportes autorizados.
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
            <div className="feature-pill-title">20+ Idiomas</div>
            <p className="feature-pill-text">
              Catálogo conectado a <span className="mono">/api/Idiomas</span> con pronunciación
              neural.
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
            <div className="feature-pill-title">Acceso Protegido</div>
            <p className="feature-pill-text">
              Sesiones por Cookie HTTP-Only y reportes validados en el backend.
            </p>
          </div>
        </div>
      </section>

      {/* Right: Authentication Card */}
      <section className="glass-card login-card">
        <div className="login-card-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
            <span className="badge badge-violet">
              <Lock size={12} />
              Acceso OAuth 2.0
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

          <h2 style={{ marginTop: 14 }}>Inicia sesión en Voxify</h2>
          <p>
            Elige cualquiera de los proveedores configurados en el backend para autenticarte y
            volver automáticamente a la aplicación.
          </p>
        </div>

        {logoutNotice && (
          <div
            style={{
              padding: '12px 14px',
              borderRadius: 12,
              background: 'rgba(52, 211, 153, 0.12)',
              border: '1px solid rgba(52, 211, 153, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              fontSize: '0.84rem',
              color: '#a7f3d0',
            }}
          >
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{logoutNotice}</span>
          </div>
        )}

        <div className="provider-stack">
          {AUTH_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              type="button"
              className={`provider-btn ${provider.accentClass}`}
              onClick={() => handleProviderLogin(provider)}
            >
              <div className="provider-left">
                <div className="provider-icon-box">
                  <ProviderIcon providerId={provider.id} size={22} />
                </div>
                <div>
                  <span className="provider-name">Continuar con {provider.name}</span>
                  <span className="provider-desc">{provider.description}</span>
                </div>
              </div>
              <ArrowRight size={18} color="#94a3b8" />
            </button>
          ))}
        </div>

        {/* Unauthenticated protection verifier (Punto 1) */}
        <div className="probe-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ShieldAlert size={15} color="#fbbf24" />
              Verificar protección sin sesión
            </span>
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Punto 1
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
            Comprueba que sin iniciar sesión (o tras hacer logout) el backend rechaza los recursos
            protegidos con <span className="mono">401 Unauthorized</span>.
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={probing}
              onClick={() => runUnauthenticatedProbe('/api/auth/me')}
            >
              Probar /api/auth/me
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              disabled={probing}
              onClick={() => runUnauthenticatedProbe('/api/Idiomas')}
            >
              Probar /api/Idiomas
            </button>
          </div>

          {displayProbe && (
            <div className="probe-result">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                <span className="mono" style={{ color: 'var(--text-secondary)' }}>
                  GET {displayProbe.path}
                </span>
                <span
                  className={`badge ${
                    displayProbe.status === 401 || displayProbe.status === 403
                      ? 'badge-emerald'
                      : displayProbe.ok
                        ? 'badge-amber'
                        : 'badge-rose'
                  }`}
                >
                  {displayProbe.status === 401
                    ? '401 Bloqueado ✓'
                    : displayProbe.status === 0
                      ? 'Backend apagado'
                      : `HTTP ${displayProbe.status}`}
                </span>
              </div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.76rem', lineHeight: 1.45 }}>
                {displayProbe.status === 401
                  ? 'Correcto: el backend rechazó el acceso sin sesión activa.'
                  : displayProbe.data?.error || displayProbe.data?.mensaje || 'Respuesta recibida del servidor.'}
              </div>
            </div>
          )}
        </div>

        <div className="divider-line">o explorar diseño</div>

        <button type="button" className="btn btn-ghost" onClick={onEnterDemoMode}>
          <Eye size={16} />
          Abrir vista previa del estudio (Modo Demo)
        </button>
      </section>
    </main>
  );
}
