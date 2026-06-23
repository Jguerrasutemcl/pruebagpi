/**
 * Página de registro.
 * Crea el usuario en Firebase Auth y guarda el perfil en Firestore vía backend.
 */
import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';

function getPasswordStrength(pw: string): { label: string; color: string; width: string } {
  if (pw.length === 0) return { label: '', color: '', width: '0%' };
  let score = 0;
  if (pw.length >= 8)          score++;
  if (/[A-Z]/.test(pw))        score++;
  if (/[0-9]/.test(pw))        score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;

  if (score <= 1) return { label: 'Débil',   color: 'bg-severity-critical', width: '25%' };
  if (score === 2) return { label: 'Media',   color: 'bg-severity-medium',   width: '50%' };
  if (score === 3) return { label: 'Fuerte',  color: 'bg-severity-low',      width: '75%' };
  return               { label: 'Muy fuerte', color: 'bg-accent-cyan',       width: '100%' };
}

export default function RegisterPage() {
  const { user, signUp, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [name, setName]             = useState('');
  const [email, setEmail]           = useState('');
  const [password, setPassword]     = useState('');
  const [confirm, setConfirm]       = useState('');
  const [error, setError]           = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/dashboard" replace />;

  const strength = getPasswordStrength(password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      await signUp(email, password, name);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const code = (err as { code?: string }).code ?? '';
      if (code.includes('email-already-in-use')) {
        setError('Este correo ya está registrado. Intenta iniciar sesión.');
      } else if (code.includes('weak-password')) {
        setError('Contraseña muy débil. Usa al menos 6 caracteres.');
      } else {
        setError('Error al registrarse. Inténtalo de nuevo.');
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

        <div className="bg-bg-secondary border border-border-primary rounded-xl p-8">
          <h2 className="text-xl font-semibold mb-6">Crear cuenta</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-text-secondary mb-1.5">
                Nombre completo
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Juan Pérez"
                className="
                  w-full px-3 py-2.5 rounded-lg
                  bg-bg-tertiary border border-border-secondary
                  text-text-primary placeholder-text-muted text-sm
                  focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent
                  transition-colors
                "
              />
            </div>

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
                placeholder="Mínimo 8 caracteres"
                className="
                  w-full px-3 py-2.5 rounded-lg
                  bg-bg-tertiary border border-border-secondary
                  text-text-primary placeholder-text-muted text-sm
                  focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent
                  transition-colors
                "
              />
              {/* Indicador de fortaleza */}
              {password && (
                <div className="mt-2">
                  <div className="h-1.5 bg-bg-quaternary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                      style={{ width: strength.width }}
                    />
                  </div>
                  <p className="text-xs text-text-muted mt-1">
                    Fortaleza: <span className="font-medium text-text-secondary">{strength.label}</span>
                  </p>
                </div>
              )}
            </div>

            {/* Confirm */}
            <div>
              <label htmlFor="confirm" className="block text-sm font-medium text-text-secondary mb-1.5">
                Confirmar contraseña
              </label>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="Repite tu contraseña"
                className={`
                  w-full px-3 py-2.5 rounded-lg
                  bg-bg-tertiary border text-text-primary placeholder-text-muted text-sm
                  focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent
                  transition-colors
                  ${confirm && confirm !== password
                    ? 'border-severity-critical'
                    : 'border-border-secondary'}
                `}
              />
              {confirm && confirm !== password && (
                <p className="text-xs text-severity-critical mt-1">Las contraseñas no coinciden.</p>
              )}
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
                transition-opacity mt-2
              "
            >
              {submitting ? 'Creando cuenta...' : 'Crear cuenta'}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="text-accent-cyan hover:underline font-medium">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}