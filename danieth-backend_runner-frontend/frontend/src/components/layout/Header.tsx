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
  
  /** 
   * CORRECCIÓN: Agregamos 'user' a la extracción. 
   * Tu AuthContext exporta: { user, profile, loading, signIn, signUp, signOut }
   */
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
      console.error("Error al cerrar sesión:", error);
    }
  };

  /**
   * CORRECCIÓN: Lógica de inicial robusta.
   * Busca en el perfil del backend primero, luego en Firebase, luego email.
   */
  const initial = (
    profile?.name || 
    user?.displayName || 
    profile?.email || 
    user?.email || 
    'U'
  ).charAt(0).toUpperCase();

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

        {/* Botón de Notificaciones */}
        <button 
          type="button" 
          className="relative p-2 rounded-lg text-text-muted hover:bg-bg-tertiary transition-colors"
          aria-label="Notificaciones"
        >
          {/* Icono de Campana (SVG nativo para no instalar nada extra) */}
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          
          {/* El Badge (El circulito rojo con el número) */}
          <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full">
            3
          </span>
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
              {/* Overlay para cerrar al hacer clic fuera */}
              <div className="fixed inset-0 z-10" onClick={() => setIsMenuOpen(false)}></div>
              
              <div className="absolute right-0 mt-2 w-64 bg-bg-secondary border border-border-primary rounded-lg shadow-2xl z-20 py-2 animate-in fade-in zoom-in duration-200">
                
                {/* 1. La cabecera con tu información (Intacta) */}
                <div className="px-4 py-3 border-b border-border-primary">
                  <p className="text-sm font-bold text-white truncate">
                    {profile?.name || user?.displayName || 'Usuario'}
                  </p>
                  <p className="text-xs text-text-secondary truncate">
                    {profile?.email || user?.email}
                  </p>
                  <div className="mt-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20">
                    {profile?.role || 'Analyst'}
                  </div>
                </div>
                
                {/* Los 3 botones requeridos */}
                <div className="p-1 border-b border-border-primary">
                  <button className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary rounded-md transition-colors flex items-center gap-2">
                    <span>👤</span> Mi Perfil
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary rounded-md transition-colors flex items-center gap-2">
                    <span>⚙️</span> Configuración
                  </button>
                  <button className="w-full text-left px-3 py-2 text-sm text-text-primary hover:bg-bg-tertiary rounded-md transition-colors flex items-center gap-2">
                    <span>❓</span> Ayuda
                  </button>
                </div>

                {/* boton para cerrar sesion */}
                <div className="p-1">
                  <button 
                    onClick={handleLogout} 
                    className="w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-2"
                  >
                    <span>🚪</span> Cerrar Sesión
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
