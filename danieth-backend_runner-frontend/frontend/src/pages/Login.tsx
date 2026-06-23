/**
 * Página de login.
 * Redirige al dashboard si ya hay sesión activa.
 * Tras login exitoso, vuelve a la URL que el usuario intentaba visitar.
 */
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const { user, signIn, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Si ya hay sesión, ir directo al dashboard (o a la URL guardada)
  if (!loading && user) {
    const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
    return <Navigate to={from} replace />;
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      await signIn(email, password);
      const from = (location.state as { from?: Location })?.from?.pathname ?? '/dashboard';
      navigate(from, { replace: true });
    } catch (err: unknown) {
      // Firebase devuelve códigos específicos; mostramos mensaje amigable
      const code = (err as { code?: string }).code ?? '';
      if (code.includes('user-not-found') || code.includes('wrong-password') || code.includes('invalid-credential')) {
        setError('Credenciales incorrectas. Revisa tu email y contraseña.');
      } else if (code.includes('too-many-requests')) {
        setError('Demasiados intentos. Espera unos minutos e inténtalo de nuevo.');
      } else {
        setError('Error al iniciar sesión. Inténtalo de nuevo.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-accent-cyan to-accent-blue mb-4 text-2xl">
            🛡️
          </div>
          <h1 className="text-2xl font-bold text-accent-cyan">{t('app.name')}</h1>
          <p className="text-text-muted text-sm mt-1">{t('app.tagline')}</p>
        </div>

        {/* Card */}
        <div className="bg-bg-secondary border border-border-primary rounded-xl p-8">
          <h2 className="text-xl font-semibold mb-6">Iniciar sesión</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-text-secondary mb-1.5">
                Correo electrónico
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                placeholder="tu@email.com"
                className="
                  w-full px-3 py-2.5 rounded-lg
                  bg-bg-tertiary border border-border-secondary
                  text-text-primary placeholder-text-muted text-sm
                  focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent
                  transition-colors
                "
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-text-secondary mb-1.5">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                placeholder="••••••••"
                className="
                  w-full px-3 py-2.5 rounded-lg
                  bg-bg-tertiary border border-border-secondary
                  text-text-primary placeholder-text-muted text-sm
                  focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent
                  transition-colors
                "
              />
            </div>

            {/* Error */}
            {error && (
              <div className="px-3 py-2.5 rounded-lg bg-severity-critical/10 border border-severity-critical/30 text-severity-critical text-sm">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="
                w-full py-2.5 rounded-lg font-medium text-sm
                bg-gradient-to-r from-accent-cyan to-accent-blue
                text-white
                hover:opacity-90 active:opacity-80
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-opacity
              "
            >
              {submitting ? 'Iniciando sesión...' : 'Iniciar sesión'}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            ¿No tienes cuenta?{' '}
            <Link to="/register" className="text-accent-cyan hover:underline font-medium">
              Regístrate
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}