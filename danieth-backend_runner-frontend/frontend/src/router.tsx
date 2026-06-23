/**
 * Router central con rutas públicas y protegidas.
 *
 * Estructura:
 *   /login     → LoginPage     (público)
 *   /register  → RegisterPage  (público)
 *   /          → ProtectedRoute > DashboardLayout > páginas privadas
 */
import { createBrowserRouter, Navigate } from 'react-router-dom';

import ProtectedRoute from '@/components/auth/ProtectedRoute';
import DashboardLayout from '@/components/layout/DashboardLayout';

import LoginPage from './pages/Login';
import RegisterPage from './pages/Register';
import DashboardPage from '@/pages/Dashboard';
import VulnerabilityHubPage from '@/pages/VulnerabilityHub';
import AIPentestingPage from '@/pages/AIPentesting';
import PatchManagerPage from '@/pages/PatchManager';
import TeamAssetsPage from '@/pages/TeamAssets';
import ReportsPage from '@/pages/Reports';
import SettingsPage from '@/pages/Settings';
import SetupCheckPage from '@/pages/SetupCheck';

export const router = createBrowserRouter([
  // ── Rutas públicas ────────────────────────────────────────────────────────
  { path: '/login',    element: <LoginPage /> },
  { path: '/register', element: <RegisterPage /> },

  // ── Rutas protegidas ──────────────────────────────────────────────────────
  {
    element: <ProtectedRoute />,   // ← Guarda de autenticación
    children: [
      {
        path: '/',
        element: <DashboardLayout />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: 'dashboard',       element: <DashboardPage /> },
          { path: 'vulnerabilities', element: <VulnerabilityHubPage /> },
          { path: 'ai-pentesting',   element: <AIPentestingPage /> },
          { path: 'patches',         element: <PatchManagerPage /> },
          { path: 'team',            element: <TeamAssetsPage /> },
          { path: 'reports',         element: <ReportsPage /> },
          { path: 'settings',        element: <SettingsPage /> },
          { path: 'setup',           element: <SetupCheckPage /> },
          { path: '*',               element: <Navigate to="/dashboard" replace /> },
        ],
      },
    ],
  },
]);