/**
 * ProtectedRoute — Guard multi-rol con redirección automática al portal correcto.
 *
 * Jerarquía de portales:
 *   super_admin  → /super-admin     (portal de gestión global)
 *   admin        → /company-admin   (portal de empresa)
 *   roles oper.  → /dashboard       (portal operativo)
 *
 * Props:
 *   allowedRoles  — roles que pueden acceder a este grupo de rutas.
 *   portalPrefix  — prefijo de URL de este portal (para detectar acceso cruzado).
 */
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  allowedRoles?: string[];
  portalPrefix?: string;
}

function roleToHome(role: string): string {
  if (role === 'super_admin') return '/super-admin';
  if (role === 'admin') return '/company-admin';
  return '/dashboard';
}

export default function ProtectedRoute({ allowedRoles, portalPrefix }: Props) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  // Spinner mientras Firebase resuelve el estado de autenticación
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

  // Sin sesión → login
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Esperar a que el perfil cargue antes de tomar decisiones de rol
  if (!profile) {
    return (
      <div className="min-h-screen bg-bg-primary flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { role } = profile;
  const home = roleToHome(role);

  // Si el usuario intenta acceder a un portal que no le corresponde, redirigir al correcto
  if (portalPrefix && !location.pathname.startsWith(portalPrefix)) {
    return <Navigate to={home} replace />;
  }

  // Verificar que el rol está en la lista permitida para este portal
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={home} replace />;
  }

  return <Outlet />;
}
