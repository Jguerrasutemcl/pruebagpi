/**
 * CompanyAdminLayout — Layout para el Admin de Empresa.
 *
 * Sidebar con solo las secciones que le corresponden al admin:
 * Panel, Team & Assets, Usuarios, Configuración.
 * El sidebar es overlay en móvil y fijo en desktop (igual que DashboardLayout).
 */
import { useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const ADMIN_NAV = [
  { path: '/company-admin',       label: 'Panel',          icon: '🏢', end: true },
  { path: '/company-admin/team',  label: 'Team & Assets',  icon: '👥', end: false },
  { path: '/company-admin/users', label: 'Usuarios',       icon: '🔑', end: false },
  { path: '/company-admin/settings', label: 'Configuración', icon: '⚙️', end: false },
];

export default function CompanyAdminLayout() {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  return (
    <div className="min-h-screen bg-bg-primary flex">
      {/* ── Sidebar ─────────────────────────────────────────────────────── */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 w-[260px] bg-bg-secondary border-r border-border-primary
          flex flex-col transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static
        `}
      >
        {/* Logo + badge de empresa */}
        <div className="h-[72px] flex items-center gap-3 px-5 border-b border-border-primary shrink-0">
          <span className="text-2xl">🛡️</span>
          <div className="min-w-0">
            <p className="text-text-primary font-bold leading-tight truncate">DANI-ETH</p>
            <p className="text-xs text-accent-cyan leading-tight font-medium truncate">
              {profile?.company_id ?? 'Admin Panel'}
            </p>
          </div>
        </div>

        {/* Navegación */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {ADMIN_NAV.map(({ path, label, icon, end }) => (
            <NavLink
              key={path}
              to={path}
              end={end}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive
                  ? 'bg-accent-cyan/10 text-accent-cyan border-l-2 border-accent-cyan pl-[14px]'
                  : 'text-text-muted hover:text-text-primary hover:bg-bg-primary/50 border-l-2 border-transparent pl-[14px]'}
              `}
            >
              <span className="text-base">{icon}</span>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer usuario */}
        <div className="p-4 border-t border-border-primary shrink-0">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-full bg-accent-cyan/20 flex items-center justify-center text-accent-cyan font-bold text-sm shrink-0">
              {profile?.name?.[0]?.toUpperCase() ?? 'A'}
            </div>
            <div className="min-w-0">
              <p className="text-text-primary text-sm font-medium truncate">{profile?.name}</p>
              <p className="text-text-muted text-xs truncate">{profile?.email}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className="w-full px-3 py-2 text-sm text-text-muted hover:text-red-400 border border-border-primary rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Overlay móvil */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Contenido principal ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-0">
        {/* Header móvil */}
        <header className="h-[72px] bg-bg-secondary border-b border-border-primary flex items-center px-6 gap-4 lg:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="text-text-muted hover:text-text-primary text-xl"
            aria-label="Abrir menú"
          >
            ☰
          </button>
          <span className="text-text-primary font-semibold">Admin Panel</span>
        </header>

        <main
          key={location.pathname}
          className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
