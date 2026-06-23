/**
 * SuperAdminLayout — Layout minimalista para el Super Admin global.
 *
 * Sin sidebar de navegación — su única función es crear/listar empresas.
 * El <Outlet /> renderiza SuperAdminPortal (formulario de creación de empresas).
 */
import { Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function SuperAdminLayout() {
  const { profile, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col">
      {/* Header simple — sin navegación lateral */}
      <header className="h-16 bg-bg-secondary border-b border-border-primary flex items-center justify-between px-6 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-2xl">🛡️</span>
          <span className="text-text-primary font-bold text-lg">DANI-ETH</span>
          <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs font-semibold rounded-full border border-red-500/30 uppercase tracking-wide">
            Super Admin
          </span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-text-muted text-sm hidden sm:block">{profile?.email}</span>
          <button
            onClick={signOut}
            className="px-3 py-1.5 text-sm text-text-muted hover:text-text-primary border border-border-primary rounded-lg transition-colors"
          >
            Cerrar sesión
          </button>
        </div>
      </header>

      {/* Contenido centrado — solo el portal de creación de empresas */}
      <main className="flex-1 flex items-start justify-center p-6 sm:p-8">
        <div className="w-full max-w-2xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
