import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { dashboardService, type DashboardSummary } from '@/services/dashboardService';

const SEVERITY_COLOR: Record<string, string> = {
  critical: 'var(--severity-critical)',
  high:     'var(--severity-high)',
  medium:   'var(--severity-medium)',
  low:      'var(--severity-low)',
};

const STATUS_COLOR: Record<string, string> = {
  running:  'var(--severity-low)',
  paused:   'var(--severity-medium)',
  stopped:  'var(--severity-critical)',
  finished: 'var(--accent-cyan)',
};

export default function DashboardPage() {
  const { t } = useTranslation();
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(null);
    dashboardService.getSummary()
      .then(setData)
      .catch(() => setError('No se pudo conectar con el backend. Verifica que esté activo en http://localhost:8000'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div className="min-h-full space-y-6">
        <div className="h-8 w-48 rounded-lg animate-pulse" style={{ background: 'var(--bg-tertiary)' }} />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 rounded-xl animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
          ))}
        </div>
        <div className="h-64 rounded-xl animate-pulse" style={{ background: 'var(--bg-secondary)' }} />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border p-8 text-center space-y-4"
           style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="text-4xl opacity-30">📊</div>
        <p className="text-sm font-semibold" style={{ color: 'var(--severity-critical)' }}>{error ?? 'Sin datos'}</p>
        <button onClick={loadData}
                className="px-4 py-2 rounded-lg text-sm font-semibold"
                style={{ background: 'rgba(0,212,255,0.08)', color: 'var(--accent-cyan)' }}>
          {t('pages.dashboard.retry', 'Reintentar')}
        </button>
      </div>
    );
  }

  const totalSeverity =
    (data.findings_by_severity.critical ?? 0) +
    (data.findings_by_severity.high ?? 0) +
    (data.findings_by_severity.medium ?? 0) +
    (data.findings_by_severity.low ?? 0);

  return (
    <div className="min-h-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          📊 {t('pages.dashboard.title', 'Dashboard')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {t('pages.dashboard.realTimeOverview', 'Resumen del estado de seguridad')}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Campañas activas" value={data.active_campaigns} accent="var(--accent-cyan)" />
        <StatCard label="Hallazgos totales" value={data.total_findings}
                  accent={data.total_findings > 0 ? 'var(--severity-high)' : 'var(--severity-low)'} />
        <StatCard label="Objetivos" value={data.total_targets} accent="var(--text-muted)" />
        <StatCard label="Reportes" value={data.total_reports} accent="var(--text-muted)" />
      </div>

      {/* Hallazgos por severidad */}
      <div className="rounded-xl border p-6 space-y-4"
           style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          Hallazgos por severidad
        </h2>
        {totalSeverity === 0 ? (
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            No hay hallazgos registrados. Inicia una campaña de AI Pentesting para comenzar.
          </p>
        ) : (
          <div className="space-y-3">
            {(['critical', 'high', 'medium', 'low'] as const).map(sev => {
              const count = data.findings_by_severity[sev] ?? 0;
              const pct = totalSeverity > 0 ? Math.round((count / totalSeverity) * 100) : 0;
              return (
                <div key={sev}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-bold uppercase" style={{ color: SEVERITY_COLOR[sev] }}>{sev}</span>
                    <span style={{ color: 'var(--text-muted)' }}>{count} ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: 'var(--bg-tertiary)' }}>
                    <div className="h-full rounded-full transition-all duration-700"
                         style={{ width: `${pct}%`, background: SEVERITY_COLOR[sev] }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Campañas recientes */}
      <div className="rounded-xl border overflow-hidden"
           style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="px-5 py-4 font-bold text-sm border-b"
             style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
          Campañas recientes
        </div>
        {data.recent_campaigns.length === 0 ? (
          <div className="p-6 text-sm text-center" style={{ color: 'var(--text-muted)' }}>
            No hay campañas registradas aún.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Campaign ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Objetivo</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Estado</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Inicio</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
              {data.recent_campaigns.map(c => (
                <tr key={c.campaign_id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: 'var(--accent-cyan)' }}>
                    {c.campaign_id.slice(0, 8)}...
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-secondary)' }}>{c.target}</td>
                  <td className="px-5 py-3">
                    <span className="text-xs font-bold uppercase"
                          style={{ color: STATUS_COLOR[c.status] ?? 'var(--text-muted)' }}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {c.started_at
                      ? new Date(c.started_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="p-5 rounded-xl border flex flex-col gap-2"
         style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
      <div className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>{label}</div>
      <div className="text-3xl font-bold" style={{ color: accent }}>{value}</div>
    </div>
  );
}
