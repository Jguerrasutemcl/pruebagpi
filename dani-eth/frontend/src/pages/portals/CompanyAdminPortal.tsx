/**
 * CompanyAdminPortal — Panel de bienvenida del Admin de Empresa.
 *
 * Acceso rápido a las secciones que le corresponden al Admin:
 * gestión de usuarios y gestión de Team & Assets.
 */
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const QUICK_ACTIONS = [
  {
    to: '/company-admin/users',
    icon: '🔑',
    title: 'Gestionar Usuarios',
    desc: 'Invitar miembros y asignar roles operativos a tu empresa',
  },
  {
    to: '/company-admin/team',
    icon: '👥',
    title: 'Team & Assets',
    desc: 'Equipos, miembros del equipo y activos de la empresa',
  },
];

export default function CompanyAdminPortal() {
  const { profile } = useAuth();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Panel de Administración</h1>
        <p className="text-text-muted mt-1 text-sm">
          Empresa:{' '}
          <span className="text-accent-cyan font-semibold">{profile?.company_id ?? '—'}</span>
        </p>
      </div>

      {/* Acciones rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {QUICK_ACTIONS.map(({ to, icon, title, desc }) => (
          <Link
            key={to}
            to={to}
            className="p-6 bg-bg-secondary border border-border-primary rounded-2xl hover:border-accent-cyan/50 transition-colors group"
          >
            <span className="text-3xl mb-3 block">{icon}</span>
            <h3 className="text-text-primary font-semibold group-hover:text-accent-cyan transition-colors">
              {title}
            </h3>
            <p className="text-text-muted text-sm mt-1">{desc}</p>
          </Link>
        ))}
      </div>

      {/* Recordatorios de seguridad */}
      <div className="bg-bg-secondary border border-border-primary rounded-2xl p-5">
        <h2 className="text-text-primary font-semibold mb-3 text-sm">Recordatorios de Seguridad</h2>
        <ul className="space-y-2 text-text-muted text-sm">
          <li>
            • Solo tú puedes crear usuarios para{' '}
            <strong className="text-text-primary">{profile?.company_id}</strong>.
          </li>
          <li>
            • Los cambios de rol requieren que el usuario cierre sesión y vuelva a iniciarla para que el nuevo token JWT surta efecto.
          </li>
          <li>
            • Los roles operativos (security_engineer, pentester, analyst, viewer) no tienen acceso a esta sección.
          </li>
          <li>
            • No puedes modificar usuarios de otras empresas.
          </li>
        </ul>
      </div>
    </div>
  );
}
