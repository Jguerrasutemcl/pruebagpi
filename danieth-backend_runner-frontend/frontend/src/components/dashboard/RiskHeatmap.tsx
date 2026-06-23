import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { HeatmapCategory } from './types';
import { severityMeta, sortSeverityWeight } from './utils';

interface Props {
  data: HeatmapCategory[];
}

export default function RiskHeatmap({ data }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const sorted = [...data].sort((a, b) => {
    const severityDiff = sortSeverityWeight(b.severity) - sortSeverityWeight(a.severity);
    return severityDiff !== 0 ? severityDiff : b.count - a.count;
  });

  const maxCount = Math.max(...sorted.map((item) => item.count));

  const getCategoryLabel = (name: string) => {
    switch (name) {
      case 'Web Applications':
        return t('pages.dashboard.webApplications');
      case 'Databases':
        return t('pages.dashboard.databases');
      case 'APIs':
        return t('pages.dashboard.apis');
      case 'Cloud Infrastructure':
        return t('pages.dashboard.cloudInfrastructure');
      case 'Network Devices':
        return t('pages.dashboard.networkDevices');
      case 'Containers':
        return t('pages.dashboard.containers');
      case 'Mobile Apps':
        return t('pages.dashboard.mobileApps');
      default:
        return name;
    }
  };

  const getSeverityLabel = (severity: HeatmapCategory['severity']) => {
    switch (severity) {
      case 'CRITICAL':
        return t('pages.dashboard.critical');
      case 'HIGH':
        return t('pages.dashboard.high');
      case 'MEDIUM':
        return t('pages.dashboard.medium');
      case 'LOW':
        return t('pages.dashboard.low');
      default:
        return severity;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border p-5"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('pages.dashboard.riskHeatmap')}
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('pages.dashboard.orderedBySeverityAndIssueCount')}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {sorted.map((item, index) => {
          const meta = severityMeta[item.severity];
          const width = `${(item.count / maxCount) * 100}%`;
          const categoryLabel = getCategoryLabel(item.name);
          const severityLabel = getSeverityLabel(item.severity);

          return (
            <div key={item.name} className="relative group w-full">
              <button
                type="button"
                onClick={() =>
                  navigate('/vulnerabilities', {
                    state: { initialTab: item.vulnerabilityTab, selectedCategory: item.name },
                  })
                }
                className="w-full block text-left"
              >
                <div className="flex items-center justify-between mb-1.5 gap-3">
                  <div
                    className="text-sm font-medium truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {categoryLabel}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${meta.badge}`}
                    >
                      {severityLabel}
                    </span>
                    <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                      {item.count} {t('pages.dashboard.issues')}
                    </span>
                  </div>
                </div>

                <div
                  className="h-3 rounded-full overflow-hidden"
                  style={{ background: 'var(--bg-tertiary)' }}
                >
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width }}
                    transition={{ delay: index * 0.08, duration: 0.5 }}
                    className="h-full rounded-full"
                    style={{ background: meta.color }}
                  />
                </div>
              </button>

              <div className="pointer-events-none absolute left-0 -top-2 -translate-y-full z-40 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150">
                <div
                  className="rounded-lg px-3 py-2 text-xs leading-relaxed shadow-lg border min-w-max max-w-[260px]"
                  style={{
                    background: 'rgba(15, 23, 42, 0.96)',
                    color: 'white',
                    borderColor: 'rgba(255,255,255,0.12)',
                  }}
                >
                  <div className="space-y-1">
                    <div className="font-semibold">{categoryLabel}</div>
                    <div>
                      {t('pages.dashboard.issues')}: {item.count}
                    </div>
                    <div>
                      {t('pages.dashboard.riskScore')}: {item.score}
                    </div>
                    <div>
                      {t('pages.dashboard.severity')}: {severityLabel}
                    </div>
                    <div>{t('pages.dashboard.clickToFilter')}</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}