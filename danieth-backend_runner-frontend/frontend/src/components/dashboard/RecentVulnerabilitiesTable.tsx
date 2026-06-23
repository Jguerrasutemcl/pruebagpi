import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { enUS, es, de, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

import type { Vulnerability } from './types';
import { severityMeta } from './utils';

interface Props {
  vulnerabilities: Vulnerability[];
  onSelect: (vulnerability: Vulnerability) => void;
}

export default function RecentVulnerabilitiesTable({
  vulnerabilities,
  onSelect,
}: Props) {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const localeMap = {
    en: enUS,
    es,
    de,
    fr,
  };

  const currentLocale =
    localeMap[i18n.language as keyof typeof localeMap] ?? enUS;

  const recentItems = vulnerabilities
    .slice()
    .sort(
      (a, b) =>
        new Date(b.detectedDate).getTime() - new Date(a.detectedDate).getTime()
    )
    .slice(0, 10);

  const getStatusLabel = (status: Vulnerability['status']) => {
    switch (status) {
      case 'Open':
        return t('pages.dashboard.open');
      case 'In Progress':
        return t('pages.dashboard.inProgress');
      case 'Resolved':
        return t('pages.dashboard.resolved');
      default:
        return status;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-xl border overflow-hidden"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
    >
      <div
        className="flex items-center justify-between p-4 border-b"
        style={{ borderColor: 'var(--border-primary)' }}
      >
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('pages.dashboard.recentVulnerabilities')}
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('pages.dashboard.latestFindings', { count: recentItems.length })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/vulnerabilities')}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ color: 'var(--accent-cyan)', background: 'rgba(0,212,255,0.08)' }}
        >
          {t('pages.dashboard.viewAll')}
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr
              className="text-left text-xs uppercase"
              style={{ color: 'var(--text-muted)', background: 'rgba(255,255,255,0.01)' }}
            >
              <th className="px-4 py-3 font-medium">{t('pages.dashboard.cveId')}</th>
              <th className="px-4 py-3 font-medium">{t('pages.dashboard.titleCol')}</th>
              <th className="px-4 py-3 font-medium">{t('pages.dashboard.severity')}</th>
              <th className="px-4 py-3 font-medium">{t('pages.dashboard.asset')}</th>
              <th className="px-4 py-3 font-medium">{t('pages.dashboard.detected')}</th>
            </tr>
          </thead>

          <tbody>
            {recentItems.map((vuln, index) => {
              const meta = severityMeta[vuln.severity];

              return (
                <motion.tr
                  key={`${vuln.cveId}-${vuln.detectedDate}-${index}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => onSelect(vuln)}
                  className="cursor-pointer border-t transition-colors"
                  style={{ borderColor: 'var(--border-primary)' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <td
                    className="px-4 py-4 text-sm font-semibold"
                    style={{ color: 'var(--accent-cyan)' }}
                  >
                    {vuln.cveId}
                  </td>

                  <td className="px-4 py-4 text-sm" style={{ color: 'var(--text-primary)' }}>
                    <div className="max-w-[260px] truncate" title={vuln.title}>
                      {vuln.title}
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-bold border ${meta.badge}`}
                    >
                      {vuln.severity}
                    </span>
                  </td>

                  <td className="px-4 py-4 text-sm" style={{ color: 'var(--text-muted)' }}>
                    <div className="max-w-[220px] truncate" title={vuln.asset}>
                      {vuln.asset}
                    </div>
                  </td>

                  <td className="px-4 py-4 text-sm">
                    <div style={{ color: 'var(--text-primary)' }}>
                      {formatDistanceToNow(new Date(vuln.detectedDate), {
                        addSuffix: true,
                        locale: currentLocale,
                      })}
                    </div>
                    <div
                      className="text-xs mt-1"
                      style={{
                        color:
                          vuln.status === 'Open'
                            ? 'var(--severity-critical)'
                            : vuln.status === 'In Progress'
                            ? 'var(--severity-medium)'
                            : 'var(--severity-low)',
                      }}
                    >
                      {getStatusLabel(vuln.status)}
                    </div>
                  </td>
                </motion.tr>
              );
            })}

            {recentItems.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-10 text-center text-sm"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {t('pages.dashboard.noData')}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}