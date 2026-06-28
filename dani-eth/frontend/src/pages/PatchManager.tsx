import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { findingService, type PatchItem } from '@/services/findingService';

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-[--severity-critical]/15 text-[--severity-critical] ring-1 ring-[--severity-critical]/30',
  high:     'bg-[--severity-high]/15 text-[--severity-high] ring-1 ring-[--severity-high]/30',
  medium:   'bg-[--severity-medium]/15 text-[--severity-medium] ring-1 ring-[--severity-medium]/30',
  low:      'bg-[--severity-low]/15 text-[--severity-low] ring-1 ring-[--severity-low]/30',
  info:     'bg-[--text-muted]/15 text-[--text-muted] ring-1 ring-[--text-muted]/30',
};

export default function PatchManagerPage() {
  const { t } = useTranslation();
  const [patches, setPatches] = useState<PatchItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  const loadPatches = () => {
    setLoading(true);
    setError(null);
    findingService.listPatches()
      .then(data => setPatches(data.items ?? []))
      .catch(() => setError('No se pudieron cargar los parches. Verifica que el orquestador esté activo.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadPatches(); }, []);

  const filtered = patches.filter(p =>
    severityFilter === 'ALL' || p.severity.toLowerCase() === severityFilter.toLowerCase()
  );

  const pendingCount  = patches.filter(p => !p.remediated).length;
  const resolvedCount = patches.filter(p => p.remediated).length;

  return (
    <div className="min-h-full space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            🔧 {t('pages.patches.title', 'Patch Management')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('pages.patches.description', 'Parches recomendados por el orquestador de IA')}
          </p>
        </div>
        <button onClick={loadPatches} disabled={loading}
                className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-40"
                style={{ background: 'rgba(0,212,255,0.08)', color: 'var(--accent-cyan)' }}>
          {loading ? 'Cargando...' : '↺ Actualizar'}
        </button>
      </div>

      {error && (
        <div className="rounded-lg px-4 py-3 text-sm"
             style={{ background: 'var(--severity-critical)18', color: 'var(--severity-critical)', border: '1px solid var(--severity-critical)30' }}>
          {error}
        </div>
      )}

      {/* Contador rápido */}
      {!loading && patches.length > 0 && (
        <div className="flex gap-4">
          <div className="px-4 py-2 rounded-lg text-xs font-bold"
               style={{ background: 'var(--severity-critical)18', color: 'var(--severity-critical)' }}>
            {pendingCount} pendientes
          </div>
          <div className="px-4 py-2 rounded-lg text-xs font-bold"
               style={{ background: 'var(--severity-low)18', color: 'var(--severity-low)' }}>
            {resolvedCount} remediados
          </div>
        </div>
      )}

      {/* Filtro de severidad */}
      {patches.length > 0 && (
        <select
          value={severityFilter}
          onChange={e => setSeverityFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg text-sm border outline-none cursor-pointer"
          style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
        >
          <option value="ALL">Todas las severidades</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      )}

      {/* Tabla */}
      {!loading && filtered.length > 0 && (
        <div className="rounded-xl border overflow-hidden"
             style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className="px-5 py-4 border-b flex justify-between items-center"
               style={{ borderColor: 'var(--border-primary)' }}>
            <h2 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
              Parches recomendados
            </h2>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {filtered.length} de {patches.length}
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr style={{ background: 'var(--bg-tertiary)' }}>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                    {t('pages.patches.table.cve', 'Finding ID')}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                    Tipo
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                    {t('pages.patches.table.severity', 'Severidad')}
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                    Acción recomendada
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>
                    Estado
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(patch => (
                  <tr key={patch.finding_id}
                      className="border-t transition-colors"
                      style={{ borderColor: 'var(--border-primary)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs font-bold" style={{ color: 'var(--accent-cyan)' }}>
                        {patch.finding_id.slice(0, 8)}...
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs" style={{ color: 'var(--text-secondary)' }}>
                      {patch.type}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${SEVERITY_STYLES[patch.severity.toLowerCase()] ?? SEVERITY_STYLES.info}`}>
                        {patch.severity}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs max-w-xs" style={{ color: 'var(--text-secondary)' }}>
                      {patch.action}
                      {patch.reference && (
                        <span className="ml-2 font-mono" style={{ color: 'var(--accent-cyan)' }}>
                          [{patch.reference}]
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs font-bold"
                            style={{ color: patch.remediated ? 'var(--severity-low)' : 'var(--severity-medium)' }}>
                        {patch.remediated ? '✓ Remediado' : '⏳ Pendiente'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {!loading && patches.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-20 text-center rounded-xl border"
             style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className="text-5xl mb-4 opacity-20">🔧</div>
          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Sin parches disponibles</p>
          <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
            Los parches aparecen aquí cuando el orquestador detecta vulnerabilidades durante una campaña.
          </p>
        </div>
      )}
    </div>
  );
}
