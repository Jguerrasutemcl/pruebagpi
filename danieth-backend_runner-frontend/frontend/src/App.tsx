/**
 * Componente raíz. Envuelve la app con ThemeProvider y AuthProvider.
 */
import { RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { AuthProvider } from '@/contexts/AuthContext';  // ← nueva importación
import { router } from '@/router';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>          {/* ← envuelve el router */}
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  );
}