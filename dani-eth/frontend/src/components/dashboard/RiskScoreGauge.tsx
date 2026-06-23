import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { RiskScoreResponse } from './types';
import { getRiskTrendMeta, getRiskZoneColor } from './utils';
import Tooltip from './Tooltip';

interface Props {
  data: RiskScoreResponse;
}

export default function RiskScoreGauge({ data }: Props) {
  const { t } = useTranslation();

  const color = getRiskZoneColor(data.score);
  const trend = getRiskTrendMeta(data.trend);
  const percentage = (data.score / 10) * 100;
  const circumference = 2 * Math.PI * 52;
  const dashOffset = circumference * (1 - percentage / 100);
  const changePercent = (((data.score - data.previous) / data.previous) * 100).toFixed(1);

  const getTrendLabel = () => {
    switch (data.trend) {
      case 'increasing':
        return t('pages.dashboard.increasing');
      case 'decreasing':
        return t('pages.dashboard.decreasing');
      case 'stable':
        return t('pages.dashboard.stable');
      default:
        return trend.label;
    }
  };

  const translatedTrendLabel = getTrendLabel();

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="rounded-xl border p-6"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
      title={`${t('pages.dashboard.previousScore')}: ${data.previous} · ${t('pages.dashboard.change')}: ${changePercent}%`}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em]" style={{ color: 'var(--text-muted)' }}>
            {t('pages.dashboard.riskScore')}
          </p>
          <p className="text-sm mt-1" style={{ color: trend.color }}>
            {trend.icon} {translatedTrendLabel}
          </p>
        </div>

        <Tooltip
          content={
            <div className="space-y-1">
              <div>
                {t('pages.dashboard.previousScore')}: {data.previous}
              </div>
              <div>
                {t('pages.dashboard.change')}: {changePercent}%
              </div>
              <div>
                {t('pages.dashboard.trend')}: {translatedTrendLabel}
              </div>
            </div>
          }
          position="bottom"
          align="right"
        >
          <div
            className="px-2.5 py-1 rounded-full text-xs font-bold cursor-help"
            style={{ background: `${color}18`, border: `1px solid ${color}30`, color }}
          >
            {t('pages.dashboard.previousScore')} {data.previous}
          </div>
        </Tooltip>
      </div>

      <div className="relative mx-auto w-40 h-40">
        <svg viewBox="0 0 140 140" className="w-full h-full -rotate-90">
          <circle cx="70" cy="70" r="52" fill="none" stroke="var(--bg-tertiary)" strokeWidth="12" />
          <motion.circle
            cx="70"
            cy="70"
            r="52"
            fill="none"
            stroke={color}
            strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold" style={{ color }}>
            {data.score.toFixed(1)}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            / 10
          </div>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-5 text-[10px] uppercase tracking-wide">
        <div
          className="text-center py-1 rounded"
          style={{ background: 'rgba(16,185,129,0.12)', color: 'var(--severity-low)' }}
        >
          0-3
        </div>
        <div
          className="text-center py-1 rounded"
          style={{ background: 'rgba(245,158,11,0.12)', color: 'var(--severity-medium)' }}
        >
          3-7
        </div>
        <div
          className="text-center py-1 rounded"
          style={{ background: 'rgba(251,146,60,0.12)', color: 'var(--severity-high)' }}
        >
          7-8.5
        </div>
        <div
          className="text-center py-1 rounded"
          style={{ background: 'rgba(239,68,68,0.12)', color: 'var(--severity-critical)' }}
        >
          8.5-10
        </div>
      </div>
    </motion.div>
  );
}