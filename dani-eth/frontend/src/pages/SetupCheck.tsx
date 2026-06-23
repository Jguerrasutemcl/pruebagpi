/**
 * Página de verificación de setup.
 *
 * Accesible vía /setup. Sirve para verificar que:
 * - El backend está accesible.
 * - Firebase está conectado en ambos lados.
 *
 * En el Paso 1 era la página principal. Ahora es una página de diagnóstico.
 */
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import apiClient from '@/lib/api';

interface HealthCheck {
  status: string;
  app_name: string;
  app_env: string;
  firebase: string;
  project_id: string | null;
}

type CheckState = 'pending' | 'ok' | 'error';

export default function SetupCheckPage() {
  const { t } = useTranslation();

  const [backendCheck, setBackendCheck] = useState<CheckState>('pending');
  const [firebaseCheck, setFirebaseCheck] = useState<CheckState>('pending');
  const [healthData, setHealthData] = useState<HealthCheck | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    apiClient
      .get<HealthCheck>('/api/v1/health')
      .then((response) => {
        setBackendCheck('ok');
        setHealthData(response.data);
        setFirebaseCheck(response.data.firebase === 'connected' ? 'ok' : 'error');
      })
      .catch((error) => {
        setBackendCheck('error');
        setFirebaseCheck('error');
        setErrorMessage(error.message);
      });
  }, []);

  const StatusIcon = ({ state }: { state: CheckState }) => {
    if (state === 'pending') return <span className="text-text-muted">⏳</span>;
    if (state === 'ok') return <span className="text-severity-low">✅</span>;
    return <span className="text-severity-critical">❌</span>;
  };

  const allOk = backendCheck === 'ok' && firebaseCheck === 'ok';

  return (
    <div className="max-w-2xl mx-auto">
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2">{t('setup.title')}</h1>
        <p className="text-sm text-text-muted">
          Verifica el estado de las conexiones del sistema.
        </p>
      </header>

      <div className="bg-bg-secondary border border-border-primary rounded-xl p-6 mb-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-bg-tertiary rounded-lg">
            <StatusIcon state={backendCheck} />
            <div>
              <p className="font-medium">
                {backendCheck === 'ok' ? t('setup.backendOk') : t('setup.checkingBackend')}
              </p>
              {healthData && (
                <p className="text-xs text-text-muted mt-1">
                  {healthData.app_name} • {healthData.app_env}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 p-4 bg-bg-tertiary rounded-lg">
            <StatusIcon state={firebaseCheck} />
            <div>
              <p className="font-medium">
                {firebaseCheck === 'ok' ? t('setup.firebaseOk') : t('setup.firebaseError')}
              </p>
              {healthData?.project_id && (
                <p className="text-xs text-text-muted mt-1">
                  Project ID: {healthData.project_id}
                </p>
              )}
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="mt-4 p-3 bg-severity-critical/10 border border-severity-critical/30 rounded-lg text-sm text-severity-critical">
            <strong>Error:</strong> {errorMessage}
          </div>
        )}
      </div>

      {allOk && (
        <div className="bg-severity-low/10 border border-severity-low/30 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-severity-low mb-3">
            ✓ {t('setup.ready')}
          </h3>
          <Link
            to="/dashboard"
            className="
              inline-block px-4 py-2 mt-2
              bg-gradient-to-r from-accent-cyan to-accent-blue
              text-white text-sm font-medium rounded-md
              hover:opacity-90 transition-opacity
            "
          >
            {t('setup.goToDashboard')} →
          </Link>
        </div>
      )}
    </div>
  );
}
