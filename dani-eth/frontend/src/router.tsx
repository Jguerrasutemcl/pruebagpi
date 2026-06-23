/**
 * Router Multi-Tenant con tres portales aislados por rol.
 *
 * Portal 1 — /super-admin    → solo super_admin  (crear/listar empresas)
 * Portal 2 — /company-admin  → solo admin        (gestión de su empresa)
 * Portal 3 — /               → roles operativos  (dashboard, scans, etc.)
 *
 * El componente ProtectedRoute redirige automáticamente al portal correcto
 * según el rol del JWT inmediatamente después del login.
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';

import ProtectedRoute     from '@/components/auth/ProtectedRoute';
import DashboardLayout    from '@/components/layout/DashboardLayout';
import SuperAdminLayout   from '@/components/layout/SuperAdminLayout';
import CompanyAdminLayout from '@/components/layout/CompanyAdminLayout';

// Páginas públicas
import LoginPage    from '@/pages/Login';
import RegisterPage from '@/pages/Register';

// Portales exclusivos
import SuperAdminPortal   from '@/pages/portals/SuperAdminPortal';
import CompanyAdminPortal from '@/pages/portals/CompanyAdminPortal';

// Páginas del portal de empresa (admin)
import CompanyUsersPage from '@/pages/company-admin/CompanyUsersPage';

// Páginas operativas (existentes)
import DashboardPage        from '@/pages/Dashboard';
import VulnerabilityHubPage from '@/pages/VulnerabilityHub';
import AIPentestingPage     from '@/pages/AIPentesting';
import PatchManagerPage     from '@/pages/PatchManager';
import TeamAssetsPage       from '@/pages/TeamAssets';
import ReportsPage          from '@/pages/Reports';
import SettingsPage         from '@/pages/Settings';
import SetupCheckPage       from '@/pages/SetupCheck';

export const router = createBrowserRouter([
  // ── Rutas públicas ────────────────────────────────────────────────────────
  { path: '/login',    element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // ── Portal Super Admin ────────────────────────────────────────────────────
  // Solo rol 'super_admin'. Cualquier otro rol es rechazado al portal correcto.
  {
    element: (
      <ProtectedRoute
        allowedRoles={['super_admin']}
        portalPrefix="/super-admin"
      />
    ),
    children: [
      {
        path: '/super-admin',
        element: <SuperAdminLayout />,
        children: [
          { index: true, element: <SuperAdminPortal /> },
        ],
      },
    ],
  },

  // ── Portal Admin de Empresa ───────────────────────────────────────────────
  // Solo rol 'admin' con company_id. Gestiona su empresa: team, users, assets.
  {
    element: (
      <ProtectedRoute
        allowedRoles={['admin']}
        portalPrefix="/company-admin"
      />
    ),
    children: [
      {
        path: '/company-admin',
        element: <CompanyAdminLayout />,
        children: [
          { index: true,         element: <CompanyAdminPortal /> },
          { path: 'team',        element: <TeamAssetsPage /> },
          { path: 'users',       element: <CompanyUsersPage /> },
          { path: 'settings',    element: <SettingsPage /> },
        ],
      },
    ],
  },

  // ── Portal Operativo ──────────────────────────────────────────────────────
  // Roles operativos: security_engineer, pentester, analyst, viewer.
  // super_admin y admin son redirigidos automáticamente por ProtectedRoute.
  // No se usa portalPrefix aquí porque las rutas operativas son raíz (/vulnerabilities,
  // /ai-pentesting, etc.) y no comparten un prefijo común como los otros portales.
  {
    element: (
      <ProtectedRoute
        allowedRoles={['security_engineer', 'pentester', 'analyst', 'viewer']}
      />
    ),
    children: [
      {
        path: '/',
        element: <DashboardLayout />,
        children: [
          { index: true,              element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard',        element: <DashboardPage /> },
          { path: 'vulnerabilities',  element: <VulnerabilityHubPage /> },
          { path: 'ai-pentesting',    element: <AIPentestingPage /> },
          { path: 'patches',          element: <PatchManagerPage /> },
          { path: 'reports',          element: <ReportsPage /> },
          { path: 'settings',         element: <SettingsPage /> },
          { path: 'setup',            element: <SetupCheckPage /> },
          { path: '*',                element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
]);
