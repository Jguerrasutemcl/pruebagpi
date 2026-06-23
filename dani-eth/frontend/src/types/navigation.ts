/**
 * Tipos compartidos del sistema de navegación.
 */

export interface NavItem {
  /** Path al que navega (URL) */
  path: string;
  /** Clave de traducción para el label en i18n */
  labelKey: string;
  /** Emoji que se muestra como icono */
  icon: string;
}

/**
 * Configuración central de las 7 secciones de la app.
 * Si querés agregar/quitar/reordenar secciones, este es el único lugar.
 */
export const NAV_ITEMS: NavItem[] = [
  { path: '/dashboard',       labelKey: 'nav.dashboard',       icon: '📊' },
  { path: '/vulnerabilities', labelKey: 'nav.vulnerabilities', icon: '🔍' },
  { path: '/ai-pentesting',   labelKey: 'nav.aiPentesting',    icon: '🤖' },
  { path: '/patches',         labelKey: 'nav.patches',         icon: '🔧' },
  { path: '/reports',         labelKey: 'nav.reports',         icon: '📈' },
  { path: '/settings',        labelKey: 'nav.settings',        icon: '⚙️' },
];
