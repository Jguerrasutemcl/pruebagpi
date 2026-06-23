import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useTheme } from '../../contexts/ThemeContext';
import { useAuth } from '../../contexts/AuthContext';
import { NAV_ITEMS } from '../../types/navigation';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export default function Header({ onOpenSidebar }: HeaderProps) {
  const { t, i18n } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const { user, profile, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const currentNavItem = NAV_ITEMS.find((item) => location.pathname.startsWith(item.path));
  const pageTitle = currentNavItem ? t(currentNavItem.labelKey) : t('app.name');
  const breadcrumb = `Home / ${pageTitle}`;

  const currentLang = ['es', 'en', 'de', 'fr'].find(l => i18n.language.startsWith(l)) ?? 'es';

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  const initial = (
    profile?.name ||
    user?.displayName ||
    profile?.email ||
    user?.email ||
    'U'
  ).charAt(0).toUpperCase();

  const role = profile?.role || 'Analyst';

  return (
    <header className="fixed top-0 right-0 z-20 left-0 lg:left-[260px] h-[72px] bg-bg-secondary border-b border-border-primary flex items-center justify-between px-4 lg:px-8">
      {/* Lado izquierdo: Hamburguesa + Título */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenSidebar}
          className="lg:hidden w-9 h-9 rounded-md bg-bg-tertiary border border-border-secondary flex items-center justify-center hover:bg-bg-quaternary transition-colors"
        >
          ☰
        </button>
        <div className="min-w-0">
          <h2 className="text-lg lg:text-xl font-semibold truncate">{pageTitle}</h2>
          <p className="text-[11px] truncate" style={{ color: 'var(--text-muted)' }}>
            {breadcrumb}
          </p>
        </div>
      </div>

      {/* Lado derecho: Idioma, Tema, Avatar */}
      <div className="flex items-center gap-2 lg:gap-3">
        <select
          value={currentLang}
          onChange={(e) => i18n.changeLanguage(e.target.value)}
          className="bg-bg-tertiary border border-border-secondary rounded-md px-2 py-1.5 text-xs lg:text-sm cursor-pointer outline-none focus:ring-2 focus:ring-accent-cyan"
        >
          <option value="es">Español</option>
          <option value="en">English</option>
          <option value="de">Deutsch</option>
          <option value="fr">Français</option>
        </select>

        <button
          type="button"
          onClick={toggleTheme}
          className="w-9 h-9 rounded-md bg-bg-tertiary border border-border-secondary flex items-center justify-center hover:bg-bg-quaternary transition-colors"
        >
          {theme === 'dark' ? '🌙' : '☀️'}
        </button>

        {/* Menú de Usuario */}
        <div className="relative">
          <div
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center text-sm font-semibold text-white cursor-pointer border-2 border-transparent hover:border-accent-cyan transition-all"
          >
            {initial}
          </div>

          {isMenuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-bg-secondary border border-border-primary rounded-lg shadow-2xl z-20 py-2">
                <div className="px-4 py-3 border-b border-border-primary">
                  <div className="inline-flex items-center px-2 py-1 rounded text-[11px] font-bold uppercase bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                    {role}
                  </div>
                </div>
                <div className="p-1">
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-2"
                  >
                    🚪 Cerrar Sesión
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
