/**
 * Sidebar de navegación.
 *
 * Comportamiento:
 * - Desktop (>=1024px): siempre visible, fijo a la izquierda, 260px de ancho.
 * - Móvil/Tablet (<1024px): oculto por default, se muestra como drawer cuando se abre.
 *
 * El estado abierto/cerrado en móvil se controla desde el componente padre
 * (DashboardLayout) a través de las props `isOpen` y `onClose`.
 */
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { NAV_ITEMS } from '@/types/navigation';

interface SidebarProps {
  /** Si el sidebar está abierto (solo aplica en móvil/tablet) */
  isOpen: boolean;
  /** Callback para cerrar el sidebar (al hacer click en un item en móvil) */
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { t } = useTranslation();

  return (
    <>
      {/* Overlay oscuro detrás del sidebar (solo móvil/tablet, solo cuando está abierto) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed left-0 top-0 z-40 h-screen w-[260px]
          bg-bg-secondary border-r border-border-primary
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}
        aria-label="Sidebar navigation"
      >
        {/* Logo */}
        <div className="px-6 py-6 border-b border-border-primary">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-gradient-to-br from-accent-cyan to-accent-blue flex items-center justify-center text-lg flex-shrink-0">
              🛡️
            </div>
            <h1 className="text-xl font-bold text-accent-cyan truncate">
              {t('app.name')}
            </h1>
          </div>
        </div>

        {/* Items de navegación */}
        <nav className="flex-1 py-4 overflow-y-auto" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onClose}
              className={({ isActive }) => `
                flex items-center gap-3 px-6 py-3
                text-sm font-medium
                border-l-[3px]
                transition-colors duration-200
                ${
                  isActive
                    ? 'bg-bg-tertiary text-accent-cyan border-accent-cyan'
                    : 'text-text-muted border-transparent hover:bg-bg-tertiary hover:text-text-primary'
                }
              `}
            >
              <span className="text-lg flex-shrink-0" aria-hidden="true">
                {item.icon}
              </span>
              <span className="truncate">{t(item.labelKey)}</span>
            </NavLink>
          ))}
        </nav>

        {/* Footer del sidebar con la versión */}
        <div className="px-6 py-4 border-t border-border-primary">
          <p className="text-xs text-text-muted">v1.0.0</p>
        </div>
      </aside>
    </>
  );
}
