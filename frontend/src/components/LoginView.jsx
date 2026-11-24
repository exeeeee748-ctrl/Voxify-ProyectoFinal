import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  AudioLines,
  CheckCircle2,
  Globe2,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Waves,
} from 'lucide-react';
import { AUTH_PROVIDERS } from '../config/voxifyConfig';
import { apiRequest, buildProviderLoginUrl } from '../services/apiClient';
import { BrandMark, ProviderIcon } from './BrandMark';
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
  const [providers, setProviders] = useState(
    () => AUTH_PROVIDERS.map((provider) => ({ ...provider, configured: null }))
  );
  const [devLoginEnabled, setDevLoginEnabled] = useState(false);
  const [loadingProviders, setLoadingProviders] = useState(true);
  const [providerError, setProviderError] = useState('');
  const [authError, setAuthError] = useState(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('authError') || '';
  });

  useEffect(() => {
    let active = true;

    (async () => {
      const res = await apiRequest('/api/auth/providers', {
        baseUrl: apiBaseUrl,
      });

      if (!active) return;

      if (res.ok && res.data) {
        const remoteProviders = Array.isArray(res.data.providers)
          ? res.data.providers
          : [];

        setProviders(
          AUTH_PROVIDERS.map((provider) => {
            const remote = remoteProviders.find((item) => item.id === provider.id);
            return {
              ...provider,
              configured: Boolean(remote?.configured),
              redirectUri: remote?.redirectUri,
            };
          })
        );
        setDevLoginEnabled(Boolean(res.data.devLoginEnabled));
        setProviderError('');
      } else {
        setProviderError(
          'No se pudo consultar el estado de los proveedores OAuth. Revisa que el backend esté encendido.'
        );
      }

      setLoadingProviders(false);
    })();

    return () => {
      active = false;
    };
  }, [apiBaseUrl]);

  const saveApiUrl = (event) => {
    event.preventDefault();
    onApiBaseUrlChange(apiDraft);
    setEditingApi(false);
  };

  const handleProviderLogin = (provider) => {
    if (provider.configured === false) return;

    const target = buildProviderLoginUrl(
      provider.loginPath,
      apiBaseUrl,
      `${window.location.origin}/estudio`
    );

    window.location.href = target;
  };

  const visibleNotice = notice || authError;

  return (
    <main className="login-page">
      {/* Left: Voice Studio Hero */}
      <section className="login-hero">
        <BrandMark playing />

        <div className="hero-eyebrow">
          <Sparkles size={14} />
          <span>Motor Kitten TTS 2 · SSO TikTok, Microsoft y Twitch</span>
        </div>

        <h1 className="hero-heading">
          Convierte cualquier texto en <span>voz natural</span> en segundos.
        </h1>

        <p className="hero-lead">
          Estudio web conectado al backend <span className="mono">.NET + PostgreSQL</span> de
          Voxify. Inicia sesión con TikTok, Microsoft o Twitch gracias al flujo OAuth 2.0 / OIDC
          unificado.
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
            <Waves size={18} color="#22d3ee" />
            <div className="feature-pill-title">SSO Unificado</div>
            <p className="feature-pill-text">
              TikTok, Microsoft y Twitch convergen en un único usuario interno de Voxify.
            </p>
          </div>
          <div className="feature-pill">
            <Globe2 size={18} color="#818cf8" />
            <div className="feature-pill-title">Catálogo de Idiomas</div>
            <p className="feature-pill-text">
              Idiomas y voces cargados desde <span className="mono">/api/idiomas</span> y PostgreSQL.
            </p>
          </div>
          <div className="feature-pill">
            <ShieldCheck size={18} color="#c084fc" />
            <div className="feature-pill-title">Sesión Segura</div>
            <p className="feature-pill-text">
              Cookie HttpOnly de Voxify, validación de <span className="mono">state</span> y PKCE.
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
              OAuth 2.0 / OIDC
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
                onChange={(event) => setApiDraft(event.target.value)}
                placeholder="http://localhost:5173"
              />
              <button type="submit" className="btn btn-primary btn-sm">
                Guardar
              </button>
            </form>
          )}

          <h2 style={{ marginTop: 14 }}>Inicia sesión en Voxify</h2>
          <p>
            Elige un proveedor configurado. La sesión de Voxify se crea en el backend y nunca se
            expone el <span className="mono">client_secret</span> al navegador.
          </p>
        </div>

        {visibleNotice && (
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
            <ShieldAlert size={18} style={{ flexShrink: 0 }} />
            <span>{visibleNotice}</span>
          </div>
        )}

        <div className="provider-stack">
          {providers.map((provider) => {
            const isUnconfigured = provider.configured === false;
            return (
              <button
                key={provider.id}
                type="button"
                className={`provider-btn ${provider.accentClass} ${
                  isUnconfigured ? 'provider-unconfigured' : ''
                }`}
                onClick={() => handleProviderLogin(provider)}
                disabled={isUnconfigured || loadingProviders}
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

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  {provider.configured === false ? (
                    <span className="badge badge-rose">No configurado</span>
                  ) : provider.configured === true ? (
                    <span className="badge badge-emerald">Listo</span>
                  ) : null}
                  <ArrowRight size={18} color="#94a3b8" />
                </div>
              </button>
            );
          })}
        </div>

        {providerError && (
          <div
            style={{
              fontSize: '0.8rem',
              color: '#fca5a5',
              lineHeight: 1.5,
              padding: '10px 12px',
              borderRadius: 10,
              background: 'rgba(251, 113, 133, 0.08)',
              border: '1px solid rgba(251, 113, 133, 0.25)',
            }}
          >
            {providerError}
          </div>
        )}

        {devLoginEnabled && (
          <>
            <div className="divider-line">o acceso de desarrollo</div>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onDevLogin}
              disabled={connecting}
            >
              <UserCheck size={16} />
              {connecting ? 'Conectando...' : 'Entrar como usuario de desarrollo'}
            </button>
          </>
        )}

        <div className="probe-box">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ShieldCheck size={15} color="#34d399" />
              Condiciones de seguridad
            </span>
            <span className="mono" style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              state + PKCE
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '0.77rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Los callbacks se procesan en el backend, el correo solo se vincula si el proveedor lo
            garantiza y cada identidad externa queda asociada a un único usuario de Voxify.
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem' }}>
            <CheckCircle2 size={14} color="#34d399" />
            <span style={{ color: 'var(--text-secondary)' }}>
              Dominio de redirección configurable por proveedor.
            </span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            fontSize: '0.76rem',
            color: 'var(--text-muted)',
          }}
        >
          <a
            href="/legal.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
          >
            Centro Legal
          </a>
          <span>·</span>
          <a
            href="/terms.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
          >
            Términos de Servicio
          </a>
          <span>·</span>
          <a
            href="/privacy.html"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}
          >
            Política de Privacidad
          </a>
        </div>
      </section>
    </main>
  );
}
