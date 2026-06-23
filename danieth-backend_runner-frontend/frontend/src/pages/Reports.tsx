import { useTranslation } from 'react-i18next';

export default function ReportsPage() {
  const { t } = useTranslation();

  const reportCards = [
    { icon: '🔍', title: 'vulnerabilityReport', desc: 'vulnerabilityDesc' },
    { icon: '🔧', title: 'patchesByTech', desc: 'patchesByTechDesc' },
    { icon: '🖥️', title: 'patchesByServer', desc: 'patchesByServerDesc' },
    { icon: '🗺️', title: 'riskHeatmap', desc: 'riskHeatmapDesc' },
    { icon: '👥', title: 'personnelAssignments', desc: 'personnelDesc' },
  ];

  return (
    <div className="min-h-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          📈 {t('pages.reports.title')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {t('pages.reports.description')}
        </p>
      </div>

      {/* Grid de Reportes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Tarjetas estándar */}
        {reportCards.map((report) => (
          <div key={report.title} className="p-6 rounded-xl border border-[--border-primary] bg-[--bg-secondary] flex flex-col justify-between hover:border-[--accent-cyan]/50 transition-colors">
            <div className="flex gap-4 items-start">
              <div className="text-4xl">{report.icon}</div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{t(`pages.reports.${report.title}`)}</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t(`pages.reports.${report.desc}`)}</p>
              </div>
            </div>
            <button className="mt-6 w-fit px-6 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-[--accent-cyan] to-[--accent-blue] text-black hover:opacity-90 active:scale-95 transition-all">
              {t('pages.reports.generate')}
            </button>
          </div>
        ))}

        {/* Tarjeta de Resumen Ejecutivo (Con Selectores) */}
        <div className="p-8 rounded-xl border border-[--border-primary] bg-[--bg-secondary] col-span-1 lg:col-span-2 flex flex-col gap-6">
            <div className="flex gap-4">
              <div className="text-4xl">📊</div>
              <div>
                <h3 className="font-bold text-lg" style={{ color: 'var(--text-primary)' }}>{t('pages.reports.execSummary')}</h3>
                <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>{t('pages.reports.execDesc')}</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-3">
              <select className="px-4 py-2 rounded-lg text-sm bg-[--bg-primary] border border-[--border-primary] text-[--text-secondary] focus:outline-none">
                <option>Last Week</option>
                <option>Last Month</option>
              </select>
              <select className="px-4 py-2 rounded-lg text-sm bg-[--bg-primary] border border-[--border-primary] text-[--text-secondary] focus:outline-none">
                <option>PDF</option>
                <option>PowerPoint</option>
                <option>Excel</option>
              </select>
              <button className="px-6 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-[--accent-cyan] to-[--accent-blue] text-black hover:opacity-90 active:scale-95 transition-all">
                {t('pages.reports.generateExec')}
              </button>
            </div>
        </div>
      </div>
    </div>
  );
}