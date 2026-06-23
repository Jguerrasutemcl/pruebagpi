/**
 * Wrapper de rutas protegidas.
 *
 * - Si Firebase aún está resolviendo el estado → muestra spinner.
 * - Si no hay usuario → redirige a /login conservando la URL destino.
 * - Si hay usuario → renderiza <Outlet /> (las rutas hijas).
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export default function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
          <p className="text-text-muted text-sm">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Guardamos la URL que intentaba visitar para redirigir después del login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
}