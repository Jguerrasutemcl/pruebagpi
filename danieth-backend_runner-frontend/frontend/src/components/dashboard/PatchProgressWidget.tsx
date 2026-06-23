import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { PatchProgressResponse } from './types';
import { severityMeta } from './utils';

interface Props {
  data: PatchProgressResponse;
}

export default function PatchProgressWidget({ data }: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

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
            {t('pages.dashboard.patchProgress')}
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('pages.dashboard.completed', {
              done: data.overall.completed,
              total: data.overall.total,
            })}
          </p>
        </div>

        <button
          type="button"
          onClick={() => navigate('/patches')}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg"
          style={{ color: 'var(--accent-cyan)', background: 'rgba(0,212,255,0.08)' }}
        >
          {t('pages.dashboard.openManager')}
        </button>
      </div>

      <div className="relative">
        <div className="h-4 rounded-full overflow-hidden flex" style={{ background: 'var(--bg-tertiary)' }}>
          {data.bySeverity.map((item, index) => {
            const meta = severityMeta[item.severity];
            const width = `${(item.completed / data.overall.total) * 100}%`;

            return (
              <div key={item.severity} className="relative h-full group" style={{ width }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: '100%' }}
                  transition={{ delay: index * 0.12, duration: 0.6 }}
                  className="h-full cursor-help"
                  style={{ background: meta.color }}
                />

                <div className="pointer-events-none absolute left-1/2 bottom-full mb-2 -translate-x-1/2 z-40 opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100 transition-all duration-150">
                  <div
                    className="rounded-lg px-3 py-2 text-xs leading-relaxed shadow-lg border min-w-max max-w-[240px]"
                    style={{
                      background: 'rgba(15, 23, 42, 0.96)',
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.12)',
                    }}
                  >
                    <div className="space-y-1">
                      <div className="font-semibold">{item.severity}</div>
                      <div>
                        {t('pages.dashboard.completed', {
                          done: item.completed,
                          total: item.total,
                        })}
                      </div>
                      <div>
                        {t('pages.dashboard.segment')}: {((item.completed / data.overall.total) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="text-3xl font-bold mt-4" style={{ color: 'var(--text-primary)' }}>
        {data.overall.percentage}%
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        {data.bySeverity.map((item) => {
          const meta = severityMeta[item.severity];
          return (
            <div
              key={item.severity}
              className="rounded-lg p-3 border"
              style={{ background: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}
            >
              <div className="text-xs font-bold" style={{ color: meta.color }}>
                {item.severity}
              </div>
              <div className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                {item.completed}/{item.total}
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}