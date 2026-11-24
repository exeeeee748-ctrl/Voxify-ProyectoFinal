import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  AudioLines,
  BarChart3,
  Clock,
  LogOut,
  Menu,
  Mic,
  Server,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { BrandMark, ProviderIcon } from './BrandMark';

const ROUTE_META = {
  '/estudio': {
    title: 'Estudio de Voz',
    subtitle: 'Síntesis de texto a voz con Kitten TTS 2',
  },
  '/voces': {
    title: 'Voces y Clonación',
    subtitle: 'Catálogo de voces predeterminadas, favoritas y vistas internas',
  },
  '/voces/clonar': {
    title: 'Clonación de Voz',
    subtitle: 'Laboratorio dedicado de clonación zero-shot con Kitten TTS 2',
  },
  '/historial': {
    title: 'Historial de Audios',
    subtitle: 'Audios generados, detalles y eliminación lógica',
  },
  '/reportes': {
    title: 'Reportes Autorizados',
    subtitle: 'Reportes combinados protegidos por política de autorización en .NET',
  },
  '/sesion': {
    title: 'Mi Cuenta y API',
    subtitle: 'Identidad autenticada, rol, permisos e instancias del backend',
  },
};

export default function AppLayout({
  user,
  demoMode,
  apiBaseUrl,
  historialCount,
  voicesCount,
  loggingOut,
  onLogout,
  children,
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const meta = ROUTE_META[location.pathname] || ROUTE_META['/estudio'];

  const initials = (user?.nombre || 'VX')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('');

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="dashboard-layout">
      <div
        className={`sidebar-backdrop ${sidebarOpen ? 'open' : ''}`}
        onClick={closeSidebar}
        aria-hidden="true"
      />

      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-top">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <BrandMark playing />
            <button
              type="button"
              className="btn btn-ghost btn-sm mobile-menu-btn"
              onClick={closeSidebar}
              aria-label="Cerrar menú"
            >
              <X size={16} />
            </button>
          </div>

          <div>
            <div className="sidebar-group-label">Estudio Vocal</div>
            <nav className="sidebar-nav" aria-label="Vistas del estudio">
              <NavLink
                to="/estudio"
                onClick={closeSidebar}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-link-main">
                  <AudioLines size={17} />
                  Estudio de Voz
                </span>
              </NavLink>

              <NavLink
                to="/voces"
                onClick={closeSidebar}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-link-main">
                  <Mic size={17} />
                  Voces y Clonación
                </span>
                <span className="sidebar-count mono">{voicesCount}</span>
              </NavLink>

              <NavLink
                to="/historial"
                onClick={closeSidebar}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-link-main">
                  <Clock size={17} />
                  Historial
                </span>
                <span className="sidebar-count mono">{historialCount}</span>
              </NavLink>
            </nav>
          </div>

          <div>
            <div className="sidebar-group-label">Autorización y Sistema</div>
            <nav className="sidebar-nav" aria-label="Vistas administrativas">
              <NavLink
                to="/reportes"
                onClick={closeSidebar}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-link-main">
                  <BarChart3 size={17} />
                  Reportes
                </span>
              </NavLink>

              <NavLink
                to="/sesion"
                onClick={closeSidebar}
                className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              >
                <span className="sidebar-link-main">
                  <ShieldCheck size={17} />
                  Mi Cuenta & API
                </span>
              </NavLink>
            </nav>
          </div>
        </div>

        <div className="sidebar-footer">
          <div className="sidebar-user-card">
            <div className="user-avatar">{initials}</div>
            <div className="user-meta" style={{ minWidth: 0, flex: 1 }}>
              <span
                className="user-name"
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
              >
                {user?.nombre}
              </span>
              <span className="user-sub">
                <ProviderIcon providerId={user?.proveedor} size={13} />
                <span>{user?.proveedor}</span>
                <span>·</span>
                <span style={{ color: 'var(--cyan)' }}>{user?.rol || 'Usuario'}</span>
              </span>
            </div>
          </div>

          <button
            type="button"
            className="btn btn-danger"
            style={{ width: '100%' }}
            onClick={onLogout}
            disabled={loggingOut}
          >
            <LogOut size={15} />
            {loggingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      <div className="main-column">
        <header className="page-topbar">
          <div className="page-topbar-left">
            <button
              type="button"
              className="btn btn-ghost btn-sm mobile-menu-btn"
              onClick={() => setSidebarOpen(true)}
              aria-label="Abrir menú"
            >
              <Menu size={18} />
            </button>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <strong style={{ fontSize: '1.02rem' }}>{meta.title}</strong>
                <span className="badge mono" style={{ padding: '2px 8px', fontSize: '0.7rem' }}>
                  {location.pathname}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                {meta.subtitle}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span className="badge badge-cyan mono">
              <Server size={12} />
              {apiBaseUrl.replace(/^https?:\/\//, '')}
            </span>
            <span className={`badge ${demoMode ? 'badge-amber' : 'badge-emerald'}`}>
              {demoMode ? 'Modo Demo' : 'Sesión Real'}
            </span>
          </div>
        </header>

        <main className="workspace">
          {demoMode && (
            <div className="demo-banner">
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Sparkles size={16} color="#fbbf24" />
                <span>
                  <strong>Modo Vista Previa activo</strong> — Puedes navegar por todas las vistas y
                  rutas reales. Para probar OAuth real con Twitch/Microsoft, vuelve a{' '}
                  <span className="mono">/login</span>.
                </span>
              </div>
              <button type="button" className="btn btn-ghost btn-sm" onClick={onLogout}>
                Ir al Login Real
              </button>
            </div>
          )}

          {children}
        </main>
      </div>
    </div>
  );
}
