/**
 * Layout principal de la aplicación (después del login).
 *
 * Estructura:
 * ┌──────────────────────────────────────────┐
 * │ Sidebar │           Header                │
 * │  260px  ├─────────────────────────────────┤
 * │         │                                 │
 * │         │       <Outlet />                │
 * │         │     (página actual)             │
 * │         │                                 │
 * └──────────────────────────────────────────┘
 *
 * El <Outlet /> es donde React Router renderiza la página correspondiente
 * a la ruta actual (Dashboard, Vulnerability Hub, etc.).
 */
import { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import Sidebar from './Sidebar';
import Header from './Header';

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Cerrar el sidebar automáticamente al cambiar de ruta (importante en móvil)
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-bg-primary text-text-primary">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <Header onOpenSidebar={() => setSidebarOpen(true)} />

      {/* Área de contenido principal */}
      <main
        key={location.pathname}        
        className="lg:ml-[260px] mt-[72px] min-h-[calc(100vh-72px)] p-4 sm:p-6 lg:p-8 animate-fade-page"
      >
        <Outlet />
      </main>
    </div>
  );
}
