import { useState, useEffect } from 'react';
import { reportService } from '@/services/reportService';
import { campaignService } from '@/services/campaignService';
import type { ReportSummary } from '@/types/report';

export default function ReportsPage() {
  const [reports, setReports] = useState<ReportSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  // ── Consulta por Campaign ID ───────────────────────────────────────────────
  const [campaignInput, setCampaignInput] = useState('');
  const [reportQuery, setReportQuery] = useState<{
    campaign_id: string;
    status: string;
    report_path: string | null;
    available: boolean;
  } | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);

  useEffect(() => {
    reportService.list()
      .then(setReports)
      .catch(() => setListError('No se pudieron cargar los reportes. Verifica que el backend esté activo.'))
      .finally(() => setLoading(false));
  }, []);

  const handleQueryReport = async () => {
    const id = campaignInput.trim();
    if (!id) return;
    setQueryLoading(true);
    setQueryError(null);
    setReportQuery(null);
    try {
      const data = await campaignService.getReport(id);
      setReportQuery(data);
    } catch {
      setQueryError('No se encontró el reporte. Verifica el Campaign ID y que el orquestador esté activo en http://localhost:8001.');
    } finally {
      setQueryLoading(false);
    }
  };

  const handleDownloadPdf = (reportId: string) => {
    reportService.downloadPdf(reportId);
  };

  return (
    <div className="min-h-full space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          📈 Reportes de Campaña
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          El orquestador genera automáticamente un reporte al finalizar cada campaña de pentesting.
        </p>
      </div>

      {/* Consultar reporte por Campaign ID */}
      <div className="rounded-xl border p-5 space-y-4"
           style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
          🔎 Consultar reporte de campaña
        </h2>
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Ingresa el Campaign ID que recibes al iniciar una campaña en AI Pentesting para ver el estado de su reporte.
        </p>
        <div className="flex gap-3">
          <input
            value={campaignInput}
            onChange={e => setCampaignInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleQueryReport()}
            placeholder="ej: 3f7a1c2e-8a4b-..."
            className="flex-1 rounded-lg px-3 py-2 text-sm outline-none border font-mono"
            style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
          />
          <button
            onClick={handleQueryReport}
            disabled={!campaignInput.trim() || queryLoading}
            className="px-5 py-2 rounded-lg text-sm font-bold transition-all disabled:opacity-40"
            style={{ background: 'var(--accent-cyan)', color: '#0a0e17' }}>
            {queryLoading ? 'Consultando...' : 'Consultar'}
          </button>
        </div>

        {queryError && (
          <div className="text-xs rounded-lg px-3 py-2"
               style={{ background: 'var(--severity-critical)18', color: 'var(--severity-critical)', border: '1px solid var(--severity-critical)30' }}>
            {queryError}
          </div>
        )}

        {reportQuery && (
          <div className="rounded-lg border p-4 space-y-2 text-xs font-mono"
               style={{ background: 'var(--bg-tertiary)', borderColor: 'rgba(0,212,255,0.2)' }}>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Campaign ID: </span>
              <span style={{ color: 'var(--text-primary)' }}>{reportQuery.campaign_id}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Estado campaña: </span>
              <span style={{ color: 'var(--text-primary)' }}>{reportQuery.status}</span>
            </div>
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Reporte: </span>
              {reportQuery.available
                ? <span style={{ color: 'var(--severity-low)' }}>✓ Disponible — {reportQuery.report_path}</span>
                : <span style={{ color: 'var(--severity-medium)' }}>
                    ⚠ No disponible aún. El orquestador lo genera al finalizar la campaña.
                  </span>
              }
            </div>
          </div>
        )}
      </div>

      {/* Histórico de reportes */}
      <div className="rounded-xl border overflow-hidden"
           style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
        <div className="px-5 py-4 font-bold text-sm border-b"
             style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}>
          Reportes generados
        </div>

        {listError && (
          <div className="px-5 py-4 text-sm" style={{ color: 'var(--severity-critical)' }}>{listError}</div>
        )}

        {loading ? (
          <div className="p-4 text-sm" style={{ color: 'var(--text-muted)' }}>Cargando...</div>
        ) : reports.length === 0 && !listError ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3 opacity-20">📄</div>
            <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Sin reportes todavía</p>
            <p className="text-xs mt-1 max-w-sm" style={{ color: 'var(--text-muted)' }}>
              Los reportes aparecen aquí una vez que el orquestador completa una campaña y los envía al backend.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--bg-tertiary)' }}>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Objetivo</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Campaign ID</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Fecha</th>
                <th className="px-5 py-3 text-left text-xs font-semibold uppercase" style={{ color: 'var(--text-muted)' }}>Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: 'var(--border-primary)' }}>
              {reports.map(report => (
                <tr key={report.report_id}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-5 py-3 text-sm" style={{ color: 'var(--text-primary)' }}>
                    {report.target}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs" style={{ color: 'var(--accent-cyan)' }}>
                    {report.campaign_id.slice(0, 8)}...
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: 'var(--text-muted)' }}>
                    {new Date(report.generated_at).toLocaleDateString('es-ES', {
                      day: '2-digit', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => handleDownloadPdf(report.report_id)}
                      className="text-xs font-bold hover:underline"
                      style={{ color: 'var(--accent-cyan)' }}>
                      ⬇ Descargar PDF
                    </button>
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
