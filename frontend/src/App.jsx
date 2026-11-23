import React, { useCallback, useEffect, useState } from 'react';
import {
  AudioLines,
  BarChart3,
  Clock,
  LogOut,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import {
  DEMO_HISTORIAL,
  DEMO_IDIOMAS,
  DEMO_USER,
  getApiBaseUrl,
  setApiBaseUrl,
} from './config/voxifyConfig';
import { apiRequest, normalizeUser } from './services/apiClient';
import { BrandMark, ProviderIcon } from './components/BrandMark';
import LoginView from './components/LoginView';
import VoiceStudioTab from './components/VoiceStudioTab';
import HistoryTab from './components/HistoryTab';
import ReportsTab from './components/ReportsTab';
import SecurityTab from './components/SecurityTab';

export default function App() {
  const [apiBaseUrl, setApiBaseUrlState] = useState(() => getApiBaseUrl());
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [activeTab, setActiveTab] = useState('studio');
  const [idiomas, setIdiomas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [logoutNotice, setLogoutNotice] = useState('');
  const [lastLogoutProbe, setLastLogoutProbe] = useState(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3800);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleApiBaseUrlChange = (nextUrl) => {
    const clean = (nextUrl || 'http://localhost:5173').trim().replace(/\/$/, '');
    setApiBaseUrl(clean);
    setApiBaseUrlState(clean);
  };

  const loadProtectedData = useCallback(
    async (baseUrl = apiBaseUrl) => {
      const [idiomasRes, historialRes] = await Promise.all([
        apiRequest('/api/Idiomas', { baseUrl }),
        apiRequest('/api/HistorialAudios', { baseUrl }),
      ]);
      if (idiomasRes.ok && Array.isArray(idiomasRes.data)) {
        setIdiomas(idiomasRes.data);
      }
      if (historialRes.ok && Array.isArray(historialRes.data)) {
        setHistorial(historialRes.data);
      }
    },
    [apiBaseUrl]
  );

  const checkSession = useCallback(
    async (baseUrl = apiBaseUrl) => {
      setCheckingAuth(true);
      const res = await apiRequest('/api/auth/me', { baseUrl });
      if (res.ok) {
        const normalized = normalizeUser(res.data);
        if (normalized) {
          setUser(normalized);
          setDemoMode(false);
          setLogoutNotice('');
          await loadProtectedData(baseUrl);
          setCheckingAuth(false);
          return;
        }
      }
      setUser(null);
      setCheckingAuth(false);
    },
    [apiBaseUrl, loadProtectedData]
  );

  useEffect(() => {
    checkSession(apiBaseUrl);
  }, [apiBaseUrl, checkSession]);

  const handleEnterDemoMode = () => {
    setDemoMode(true);
    setUser(DEMO_USER);
    setIdiomas(DEMO_IDIOMAS);
    setHistorial(DEMO_HISTORIAL);
    setLogoutNotice('');
    setActiveTab('studio');
    showToast('Vista previa activada. Puedes cambiar a conexión real en cualquier momento.');
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    if (demoMode) {
      setDemoMode(false);
      setUser(null);
      setLogoutNotice('Saliste de la vista previa. Inicia sesión con Twitch o Microsoft para usar el backend real.');
      setLastLogoutProbe(null);
      setLoggingOut(false);
      return;
    }

    const logoutRes = await apiRequest('/api/auth/logout', {
      method: 'POST',
      baseUrl: apiBaseUrl,
    });

    // Immediately verify protected resource rejection after logout (Punto 1)
    const verifyAfterLogout = await apiRequest('/api/auth/me', {
      method: 'GET',
      baseUrl: apiBaseUrl,
    });

    setUser(null);
    setIdiomas([]);
    setHistorial([]);
    setLastLogoutProbe({ path: '/api/auth/me', ...verifyAfterLogout });
    setLogoutNotice(
      logoutRes.ok
        ? 'Sesión cerrada correctamente. Se comprobó que /api/auth/me ahora rechaza el acceso.'
        : 'Sesión local cerrada. Verifica el estado del backend.'
    );
    setLoggingOut(false);
  };

  const handleAudioGenerated = (item) => {
    if (demoMode) {
      const nextHist = {
        id: Math.floor(Math.random() * 900 + 200),
        audioId: item.id,
        fechaRegistro: item.fechaCreacion,
        visible: true,
        voiceName: item.voiceName,
        languageName: item.languageName,
        duration: item.duration,
        texto: item.texto,
        audio: {
          id: item.id,
          nombreArchivo: item.nombreArchivo,
          rutaArchivo: `/audios/${item.nombreArchivo}`,
          fechaCreacion: item.fechaCreacion,
          activo: true,
        },
      };
      setHistorial((prev) => [nextHist, ...prev]);
    } else {
      loadProtectedData(apiBaseUrl);
    }
  };

  const handleHideDemoItem = (id) => {
    setHistorial((prev) => prev.filter((item) => item.id !== id));
  };

  const initials = (user?.nombre || 'VX')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  return (
    <>
      <div className="voxify-backdrop" />
      <div className="voxify-grid-overlay" />

      <div className="app-shell">
        {checkingAuth ? (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 16,
              padding: 32,
            }}
          >
            <BrandMark playing />
            <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
              Verificando sesión con <span className="mono">{apiBaseUrl}/api/auth/me</span>...
            </span>
          </div>
        ) : !user ? (
          <LoginView
            apiBaseUrl={apiBaseUrl}
            onApiBaseUrlChange={handleApiBaseUrlChange}
            logoutNotice={logoutNotice}
            lastLogoutProbe={lastLogoutProbe}
            onEnterDemoMode={handleEnterDemoMode}
          />
        ) : (
          <>
            <header className="topbar">
              <div className="topbar-inner">
                <BrandMark playing compact />

                <nav className="nav-tabs" aria-label="Navegación principal">
                  <button
                    type="button"
                    className={`nav-tab ${activeTab === 'studio' ? 'active' : ''}`}
                    onClick={() => setActiveTab('studio')}
                  >
                    <AudioLines size={15} />
                    Estudio de Voz
                  </button>
                  <button
                    type="button"
                    className={`nav-tab ${activeTab === 'history' ? 'active' : ''}`}
                    onClick={() => setActiveTab('history')}
                  >
                    <Clock size={15} />
                    Historial ({historial.length})
                  </button>
                  <button
                    type="button"
                    className={`nav-tab ${activeTab === 'reports' ? 'active' : ''}`}
                    onClick={() => setActiveTab('reports')}
                  >
                    <BarChart3 size={15} />
                    Reportes
                  </button>
                  <button
                    type="button"
                    className={`nav-tab ${activeTab === 'security' ? 'active' : ''}`}
                    onClick={() => setActiveTab('security')}
                  >
                    <ShieldCheck size={15} />
                    Sesión & API
                  </button>
                </nav>

                <div className="user-chip">
                  <div className="user-avatar">{initials}</div>
                  <div className="user-meta">
                    <span className="user-name">{user.nombre}</span>
                    <span className="user-sub">
                      <ProviderIcon providerId={user.proveedor} size={13} />
                      <span>{user.proveedor}</span>
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-danger btn-sm"
                    onClick={handleLogout}
                    disabled={loggingOut}
                    title="Cerrar sesión"
                  >
                    <LogOut size={14} />
                    {loggingOut ? 'Saliendo...' : 'Salir'}
                  </button>
                </div>
              </div>
            </header>

            <main className="workspace">
              {demoMode && (
                <div className="demo-banner">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Sparkles size={16} color="#fbbf24" />
                    <span>
                      <strong>Modo Vista Previa activo</strong> — Estás explorando la interfaz sin
                      sesión real. Para probar OAuth real con Twitch/Microsoft, cierra esta vista y
                      conéctate a <span className="mono">{apiBaseUrl}</span>.
                    </span>
                  </div>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={handleLogout}>
                    Volver al Login Real
                  </button>
                </div>
              )}

              {/* Quick summary stats */}
              <section className="stats-grid">
                <div className="stat-card">
                  <div className="stat-label">Estado de Sesión</div>
                  <div className="stat-value" style={{ fontSize: '1.15rem', color: 'var(--emerald)' }}>
                    Autenticado · {user.proveedor}
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Idiomas Activos</div>
                  <div className="stat-value mono">{idiomas.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Audios en Historial</div>
                  <div className="stat-value mono">{historial.length}</div>
                </div>
                <div className="stat-card">
                  <div className="stat-label">Backend Conectado</div>
                  <div className="stat-value mono" style={{ fontSize: '0.95rem', color: 'var(--cyan)' }}>
                    {apiBaseUrl.replace(/^https?:\/\//, '')}
                  </div>
                </div>
              </section>

              {activeTab === 'studio' && (
                <VoiceStudioTab
                  demoMode={demoMode}
                  apiBaseUrl={apiBaseUrl}
                  idiomas={idiomas}
                  onReloadIdiomas={() => loadProtectedData(apiBaseUrl)}
                  onAudioGenerated={handleAudioGenerated}
                  showToast={showToast}
                />
              )}

              {activeTab === 'history' && (
                <HistoryTab
                  demoMode={demoMode}
                  apiBaseUrl={apiBaseUrl}
                  historial={historial}
                  onReloadHistorial={() => loadProtectedData(apiBaseUrl)}
                  onHideDemoItem={handleHideDemoItem}
                  showToast={showToast}
                />
              )}

              {activeTab === 'reports' && (
                <ReportsTab user={user} demoMode={demoMode} apiBaseUrl={apiBaseUrl} showToast={showToast} />
              )}

              {activeTab === 'security' && (
                <SecurityTab
                  user={user}
                  demoMode={demoMode}
                  apiBaseUrl={apiBaseUrl}
                  onApiBaseUrlChange={handleApiBaseUrlChange}
                  showToast={showToast}
                />
              )}
            </main>
          </>
        )}
      </div>

      {toast && (
        <div
          className="toast"
          style={{
            borderColor:
              toast.type === 'error' ? 'rgba(251, 113, 133, 0.55)' : 'rgba(56, 189, 248, 0.45)',
          }}
          role="status"
        >
          <Sparkles size={16} color={toast.type === 'error' ? '#fb7185' : '#22d3ee'} />
          <span>{toast.message}</span>
        </div>
      )}
    </>
  );
}
