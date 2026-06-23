import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { ActiveScan } from './types';

interface Props {
  scans: ActiveScan[];
}

const statusMeta: Record<ActiveScan['status'], { color: string; bg: string }> = {
  Running: { color: 'var(--severity-low)', bg: 'rgba(16,185,129,0.10)' },
  Paused: { color: 'var(--severity-medium)', bg: 'rgba(245,158,11,0.10)' },
  Queued: { color: 'var(--text-muted)', bg: 'rgba(139,146,168,0.10)' },
};

export default function ActiveScansWidget({ scans }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const getStatusLabel = (status: ActiveScan['status']) => {
    switch (status) {
      case 'Running':
        return t('pages.dashboard.running');
      case 'Paused':
        return t('pages.dashboard.paused');
      case 'Queued':
        return t('pages.dashboard.queued');
      default:
        return status;
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
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('pages.dashboard.activeScans')}
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('pages.dashboard.realTimeStatus')}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/ai-pentesting')}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ color: 'var(--accent-cyan)', background: 'rgba(0,212,255,0.08)' }}
        >
          {t('pages.dashboard.openEngine')}
        </button>
      </div>

      <div className="space-y-4">
        {scans.map((scan) => {
          const meta = statusMeta[scan.status];

          return (
            <button
              key={scan.id}
              type="button"
              onClick={() => navigate('/ai-pentesting')}
              className="w-full text-left rounded-lg p-4 border transition-colors hover:bg-bg-tertiary"
              style={{ borderColor: 'var(--border-primary)', background: 'var(--bg-primary)' }}
            >
              <div className="flex items-center justify-between gap-3 mb-2">
                <div>
                  <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
                    {scan.target}
                  </div>
                  <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {t('pages.dashboard.eta')}: {scan.eta}
                  </div>
                </div>

                <div
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${scan.status === 'Running' ? 'animate-pulse' : ''}`}
                  style={{ color: meta.color, background: meta.bg }}
                >
                  {getStatusLabel(scan.status)}
                </div>
              </div>

              <div className="flex items-center justify-between text-xs mb-2">
                <span style={{ color: 'var(--text-muted)' }}>
                  {t('pages.dashboard.progress')}
                </span>
                <span style={{ color: 'var(--text-primary)' }}>{scan.progress}%</span>
              </div>

              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${scan.progress}%` }}
                  transition={{ duration: 0.8 }}
                  className="h-full rounded-full"
                  style={{ background: scan.status === 'Queued' ? 'var(--text-muted)' : 'var(--accent-cyan)' }}
                />
              </div>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}