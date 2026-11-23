import React, { useCallback, useEffect, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import {
  DEMO_HISTORIAL,
  DEMO_IDIOMAS,
  DEMO_USER,
  KITTEN_VOICES,
  getApiBaseUrl,
  setApiBaseUrl,
} from './config/voxifyConfig';
import { apiRequest, normalizeUser } from './services/apiClient';
import { BrandMark } from './components/BrandMark';
import AppLayout from './components/AppLayout';
import LoginView from './components/LoginView';
import VoiceStudioTab from './components/VoiceStudioTab';
import VoicesCloningTab from './components/VoicesCloningTab';
import HistoryTab from './components/HistoryTab';
import ReportsTab from './components/ReportsTab';
import SecurityTab from './components/SecurityTab';

export default function App() {
  const navigate = useNavigate();
  const [apiBaseUrl, setApiBaseUrlState] = useState(() => getApiBaseUrl());
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [demoMode, setDemoMode] = useState(false);
  const [idiomas, setIdiomas] = useState([]);
  const [historial, setHistorial] = useState([]);
  const [voices, setVoices] = useState(() => KITTEN_VOICES);
  const [selectedVoiceId, setSelectedVoiceId] = useState(() => {
    return window.localStorage.getItem('voxify_last_voice') || KITTEN_VOICES[0].id;
  });
  const [favoriteVoices, setFavoriteVoices] = useState(() => {
    try {
      return JSON.parse(window.localStorage.getItem('voxify_fav_voices') || '["kitten-aura-es"]');
    } catch {
      return ['kitten-aura-es'];
    }
  });
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

  useEffect(() => {
    window.localStorage.setItem('voxify_last_voice', selectedVoiceId);
  }, [selectedVoiceId]);

  useEffect(() => {
    window.localStorage.setItem('voxify_fav_voices', JSON.stringify(favoriteVoices));
  }, [favoriteVoices]);

  const handleApiBaseUrlChange = (nextUrl) => {
    const clean = (nextUrl || 'http://localhost:5173').trim().replace(/\/$/, '');
    setApiBaseUrl(clean);
    setApiBaseUrlState(clean);
  };

  const handleToggleFavoriteVoice = (id) => {
    setFavoriteVoices((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleAddClonedVoice = (newVoice) => {
    setVoices((prev) => [newVoice, ...prev]);
    setSelectedVoiceId(newVoice.id);
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
    navigate('/estudio', { replace: true });
    showToast('Vista previa activada. Explora todas las vistas desde la barra lateral.');
  };

  const handleLogout = async () => {
    setLoggingOut(true);

    if (demoMode) {
      setDemoMode(false);
      setUser(null);
      setLogoutNotice(
        'Saliste de la vista previa. Inicia sesión con Twitch o Microsoft para usar el backend real.'
      );
      setLastLogoutProbe(null);
      setLoggingOut(false);
      navigate('/login', { replace: true });
      return;
    }

    const logoutRes = await apiRequest('/api/auth/logout', {
      method: 'POST',
      baseUrl: apiBaseUrl,
    });

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
    navigate('/login', { replace: true });
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

  const wrapProtected = (element) => {
    if (!user) return <Navigate to="/login" replace />;
    return (
      <AppLayout
        user={user}
        demoMode={demoMode}
        apiBaseUrl={apiBaseUrl}
        historialCount={historial.length}
        voicesCount={voices.length}
        loggingOut={loggingOut}
        onLogout={handleLogout}
      >
        {element}
      </AppLayout>
    );
  };

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
        ) : (
          <Routes>
            <Route
              path="/login"
              element={
                user ? (
                  <Navigate to="/estudio" replace />
                ) : (
                  <LoginView
                    apiBaseUrl={apiBaseUrl}
                    onApiBaseUrlChange={handleApiBaseUrlChange}
                    logoutNotice={logoutNotice}
                    lastLogoutProbe={lastLogoutProbe}
                    onEnterDemoMode={handleEnterDemoMode}
                  />
                )
              }
            />

            <Route
              path="/estudio"
              element={wrapProtected(
                <VoiceStudioTab
                  demoMode={demoMode}
                  apiBaseUrl={apiBaseUrl}
                  idiomas={idiomas}
                  voices={voices}
                  selectedVoiceId={selectedVoiceId}
                  favoriteVoices={favoriteVoices}
                  onSelectVoice={setSelectedVoiceId}
                  onToggleFavoriteVoice={handleToggleFavoriteVoice}
                  onReloadIdiomas={() => loadProtectedData(apiBaseUrl)}
                  onAudioGenerated={handleAudioGenerated}
                  showToast={showToast}
                />
              )}
            />

            <Route
              path="/voces/*"
              element={wrapProtected(
                <VoicesCloningTab
                  voices={voices}
                  selectedVoiceId={selectedVoiceId}
                  favoriteVoices={favoriteVoices}
                  onSelectVoice={setSelectedVoiceId}
                  onToggleFavoriteVoice={handleToggleFavoriteVoice}
                  onAddClonedVoice={handleAddClonedVoice}
                  showToast={showToast}
                />
              )}
            />

            <Route
              path="/historial"
              element={wrapProtected(
                <HistoryTab
                  demoMode={demoMode}
                  apiBaseUrl={apiBaseUrl}
                  historial={historial}
                  onReloadHistorial={() => loadProtectedData(apiBaseUrl)}
                  onHideDemoItem={handleHideDemoItem}
                  showToast={showToast}
                />
              )}
            />

            <Route
              path="/reportes"
              element={wrapProtected(
                <ReportsTab
                  user={user}
                  demoMode={demoMode}
                  apiBaseUrl={apiBaseUrl}
                  showToast={showToast}
                />
              )}
            />

            <Route
              path="/sesion"
              element={wrapProtected(
                <SecurityTab
                  user={user}
                  demoMode={demoMode}
                  apiBaseUrl={apiBaseUrl}
                  onApiBaseUrlChange={handleApiBaseUrlChange}
                  showToast={showToast}
                />
              )}
            />

            <Route path="*" element={<Navigate to={user ? '/estudio' : '/login'} replace />} />
          </Routes>
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
