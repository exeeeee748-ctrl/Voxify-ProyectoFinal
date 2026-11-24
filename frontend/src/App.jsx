import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import { getApiBaseUrl, setApiBaseUrl } from './config/voxifyConfig';
import {
  apiRequest,
  extractErrorMessage,
  normalizeAudio,
  normalizeClonacion,
  normalizeGeneracion,
  normalizeIdioma,
  normalizeUser,
  normalizeVoz,
} from './services/apiClient';
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
  const [connecting, setConnecting] = useState(true);
  const [loadingData, setLoadingData] = useState(false);
  const [idiomas, setIdiomas] = useState([]);
  const [voices, setVoices] = useState([]);
  const [favoriteVoices, setFavoriteVoices] = useState([]);
  const [generaciones, setGeneraciones] = useState([]);
  const [clonaciones, setClonaciones] = useState([]);
  const [configuracion, setConfiguracion] = useState({
    idUltimaVoz: null,
    idUltimoIdioma: null,
    tema: null,
  });
  const [selectedVoiceId, setSelectedVoiceId] = useState(null);
  const [selectedLangId, setSelectedLangId] = useState(null);
  const [loginNotice, setLoginNotice] = useState('');
  const [toast, setToast] = useState(null);
  const configRef = useRef(configuracion);

  useEffect(() => {
    configRef.current = configuracion;
  }, [configuracion]);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4200);
    return () => clearTimeout(timer);
  }, [toast]);

  const attachAudio = useCallback(async (rawGeneraciones, baseUrl) => {
    const generacionesNormalizadas = (rawGeneraciones || [])
      .map(normalizeGeneracion)
      .filter(Boolean);

    return Promise.all(
      generacionesNormalizadas.map(async (generacion) => {
        if (!generacion.idAudio) return generacion;
        const res = await apiRequest(`/api/audios/${generacion.idAudio}`, { baseUrl });
        return res.ok
          ? { ...generacion, audio: normalizeAudio(res.data) }
          : generacion;
      })
    );
  }, []);

  const reloadGeneraciones = useCallback(
    async (baseUrl = apiBaseUrl) => {
      const res = await apiRequest('/api/usuarios/me/generaciones', { baseUrl });
      if (res.ok && Array.isArray(res.data)) {
        setGeneraciones(await attachAudio(res.data, baseUrl));
      }
    },
    [apiBaseUrl, attachAudio]
  );

  const reloadClonaciones = useCallback(
    async (baseUrl = apiBaseUrl) => {
      const res = await apiRequest('/api/usuarios/me/clonaciones', { baseUrl });
      if (res.ok && Array.isArray(res.data)) {
        setClonaciones(res.data.map(normalizeClonacion).filter(Boolean));
      }
    },
    [apiBaseUrl]
  );

  const loadData = useCallback(
    async (baseUrl = apiBaseUrl) => {
      setLoadingData(true);

      const [idiomasRes, vocesRes, clonadasRes, favoritosRes, generacionesRes, clonacionesRes, configRes] =
        await Promise.all([
          apiRequest('/api/idiomas', { baseUrl }),
          apiRequest('/api/voces', { baseUrl }),
          apiRequest('/api/usuarios/me/voces-clonadas', { baseUrl }),
          apiRequest('/api/usuarios/me/favoritos/voces', { baseUrl }),
          apiRequest('/api/usuarios/me/generaciones', { baseUrl }),
          apiRequest('/api/usuarios/me/clonaciones', { baseUrl }),
          apiRequest('/api/usuarios/me/configuracion', { baseUrl }),
        ]);

      const idiomasData =
        idiomasRes.ok && Array.isArray(idiomasRes.data)
          ? idiomasRes.data.map(normalizeIdioma).filter(Boolean)
          : [];

      const predeterminadas =
        vocesRes.ok && Array.isArray(vocesRes.data)
          ? vocesRes.data.map((voz, index) => normalizeVoz(voz, index)).filter(Boolean)
          : [];

      const clonadasRaw =
        clonadasRes.ok && Array.isArray(clonadasRes.data) ? clonadasRes.data : [];
      const clonadas = clonadasRaw
        .map((voz, index) =>
          normalizeVoz(
            { ...voz, tipo: 'Clonada', estado: voz.estado ?? 'Disponible' },
            predeterminadas.length + index
          )
        )
        .filter(Boolean);

      const todasLasVoces = [...predeterminadas, ...clonadas];

      const favoritos =
        favoritosRes.ok && Array.isArray(favoritosRes.data)
          ? favoritosRes.data
              .map((voz) => normalizeVoz(voz))
              .filter(Boolean)
              .map((voz) => voz.id)
          : [];

      const generacionesData =
        generacionesRes.ok && Array.isArray(generacionesRes.data)
          ? await attachAudio(generacionesRes.data, baseUrl)
          : [];

      const clonacionesData =
        clonacionesRes.ok && Array.isArray(clonacionesRes.data)
          ? clonacionesRes.data.map(normalizeClonacion).filter(Boolean)
          : [];

      const configData =
        configRes.ok && configRes.data
          ? {
              idUltimaVoz: configRes.data.idUltimaVoz ?? configRes.data.IdUltimaVoz ?? null,
              idUltimoIdioma:
                configRes.data.idUltimoIdioma ?? configRes.data.IdUltimoIdioma ?? null,
              tema: configRes.data.tema ?? configRes.data.Tema ?? null,
            }
          : { idUltimaVoz: null, idUltimoIdioma: null, tema: null };

      setIdiomas(idiomasData);
      setVoices(todasLasVoces);
      setFavoriteVoices(favoritos);
      setGeneraciones(generacionesData);
      setClonaciones(clonacionesData);
      setConfiguracion(configData);
      configRef.current = configData;

      setSelectedVoiceId((prev) => {
        const candidato = prev ?? configData.idUltimaVoz ?? todasLasVoces[0]?.id ?? null;
        return todasLasVoces.some((voz) => String(voz.id) === String(candidato))
          ? candidato
          : todasLasVoces[0]?.id ?? null;
      });

      setSelectedLangId((prev) => {
        const candidato = prev ?? configData.idUltimoIdioma ?? idiomasData[0]?.id ?? null;
        return idiomasData.some((idioma) => String(idioma.id) === String(candidato))
          ? candidato
          : idiomasData[0]?.id ?? null;
      });

      setLoadingData(false);
      return { idiomas: idiomasData, voices: todasLasVoces, generaciones: generacionesData };
    },
    [apiBaseUrl, attachAudio]
  );

  const checkSession = useCallback(
    async (baseUrl = apiBaseUrl) => {
      setConnecting(true);

      const authRes = await apiRequest('/api/auth/me', { baseUrl });
      if (authRes.ok) {
        const normalized = normalizeUser(authRes.data);
        if (normalized) {
          setUser(normalized);
          setLoginNotice('');
          await loadData(baseUrl);
          setConnecting(false);
          return true;
        }
      }

      setUser(null);
      setConnecting(false);
      return false;
    },
    [apiBaseUrl, loadData]
  );

  useEffect(() => {
    checkSession(apiBaseUrl);
  }, [apiBaseUrl, checkSession]);

  const handleApiBaseUrlChange = (nextUrl) => {
    const clean = (nextUrl || 'http://localhost:5173').trim().replace(/\/$/, '');
    setApiBaseUrl(clean);
    setApiBaseUrlState(clean);
    setLoginNotice('');
  };

  const saveConfig = useCallback(
    async (patch) => {
      const next = { ...configRef.current, ...patch };
      configRef.current = next;
      setConfiguracion(next);

      const res = await apiRequest('/api/usuarios/me/configuracion', {
        method: 'PUT',
        baseUrl: apiBaseUrl,
        body: next,
      });

      if (!res.ok) {
        showToast('No se pudo guardar la preferencia en el backend.', 'error');
      }
    },
    [apiBaseUrl, showToast]
  );

  const handleSelectVoice = (voiceId) => {
    setSelectedVoiceId(voiceId);
    saveConfig({ idUltimaVoz: Number(voiceId) });
  };

  const handleSelectLang = (langId) => {
    setSelectedLangId(langId);
    saveConfig({ idUltimoIdioma: Number(langId) });
  };

  const handleToggleFavoriteVoice = async (voiceId) => {
    const id = Number(voiceId);
    const yaEsFavorita = favoriteVoices.some((favorito) => String(favorito) === String(id));

    setFavoriteVoices((prev) =>
      yaEsFavorita ? prev.filter((favorito) => String(favorito) !== String(id)) : [...prev, id]
    );

    const res = await apiRequest(`/api/usuarios/me/favoritos/voces/${id}`, {
      method: yaEsFavorita ? 'DELETE' : 'POST',
      baseUrl: apiBaseUrl,
    });

    if (!res.ok) {
      setFavoriteVoices((prev) =>
        yaEsFavorita ? [...prev, id] : prev.filter((favorito) => String(favorito) !== String(id))
      );
      showToast(`No se pudo actualizar el favorito (HTTP ${res.status}).`, 'error');
    }
  };

  const handleDevLogin = async () => {
    setConnecting(true);
    const res = await apiRequest('/api/auth/dev-login', {
      method: 'POST',
      baseUrl: apiBaseUrl,
    });
    setConnecting(false);

    if (!res.ok) {
      setLoginNotice(
        extractErrorMessage(
          res,
          'El acceso de desarrollo está deshabilitado o el backend no está disponible.'
        )
      );
      showToast('No se pudo iniciar la sesión de desarrollo.', 'error');
      return;
    }

    const ok = await checkSession(apiBaseUrl);
    if (ok) {
      navigate('/estudio', { replace: true });
      showToast('Sesión de desarrollo iniciada con el backend .NET.');
    }
  };

  const handleLogout = async () => {
    await apiRequest('/api/auth/logout', {
      method: 'POST',
      baseUrl: apiBaseUrl,
    });

    setUser(null);
    setIdiomas([]);
    setVoices([]);
    setFavoriteVoices([]);
    setGeneraciones([]);
    setClonaciones([]);
    setLoginNotice('Sesión cerrada correctamente. Vuelve a iniciar sesión con un proveedor.');
    navigate('/login', { replace: true });
  };

  const handleAudioGenerated = async () => {
    await reloadGeneraciones(apiBaseUrl);
  };

  const wrapProtected = (element) => {
    if (!user) return <Navigate to="/login" replace />;
    return (
      <AppLayout
        user={user}
        generacionesCount={generaciones.length}
        voicesCount={voices.length}
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
        {connecting ? (
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
              Conectando con <span className="mono">{apiBaseUrl}/api/usuarios/me</span>...
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
                    onDevLogin={handleDevLogin}
                    connecting={connecting}
                    notice={loginNotice}
                  />
                )
              }
            />

            <Route
              path="/estudio"
              element={wrapProtected(
                <VoiceStudioTab
                  apiBaseUrl={apiBaseUrl}
                  idiomas={idiomas}
                  voices={voices}
                  selectedVoiceId={selectedVoiceId}
                  selectedLangId={selectedLangId}
                  favoriteVoices={favoriteVoices}
                  onSelectVoice={handleSelectVoice}
                  onSelectLang={handleSelectLang}
                  onToggleFavoriteVoice={handleToggleFavoriteVoice}
                  onReloadCatalog={() => loadData(apiBaseUrl)}
                  onAudioGenerated={handleAudioGenerated}
                  showToast={showToast}
                />
              )}
            />

            <Route
              path="/voces/*"
              element={wrapProtected(
                <VoicesCloningTab
                  apiBaseUrl={apiBaseUrl}
                  voices={voices}
                  selectedVoiceId={selectedVoiceId}
                  favoriteVoices={favoriteVoices}
                  clonaciones={clonaciones}
                  onSelectVoice={handleSelectVoice}
                  onToggleFavoriteVoice={handleToggleFavoriteVoice}
                  onReloadClonaciones={() => reloadClonaciones(apiBaseUrl)}
                  showToast={showToast}
                />
              )}
            />

            <Route
              path="/historial"
              element={wrapProtected(
                <HistoryTab
                  apiBaseUrl={apiBaseUrl}
                  generaciones={generaciones}
                  onReload={() => reloadGeneraciones(apiBaseUrl)}
                  showToast={showToast}
                />
              )}
            />

            <Route
              path="/reportes"
              element={wrapProtected(
                <ReportsTab user={user} apiBaseUrl={apiBaseUrl} showToast={showToast} />
              )}
            />

            <Route
              path="/sesion"
              element={wrapProtected(
                <SecurityTab
                  user={user}
                  apiBaseUrl={apiBaseUrl}
                  onApiBaseUrlChange={handleApiBaseUrlChange}
                  onUserUpdated={setUser}
                  showToast={showToast}
                />
              )}
            />

            <Route path="*" element={<Navigate to={user ? '/estudio' : '/login'} replace />} />
          </Routes>
        )}
      </div>

      {loadingData && (
        <div
          className="badge badge-cyan"
          style={{ position: 'fixed', right: 18, bottom: 18, zIndex: 60, padding: '8px 12px' }}
        >
          Actualizando datos...
        </div>
      )}

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
