import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import type { QuickStatsResponse } from './types';

interface Props {
  data: QuickStatsResponse;
}

export default function QuickStatsCards({ data }: Props) {
  const { t } = useTranslation();

  const cards = [
    {
      label: t('pages.dashboard.criticalIssues'),
      value: data.critical,
      secondary: t('pages.dashboard.requiresImmediateAction'),
      icon: '⚠️',
      color: 'var(--severity-critical)',
      bg: 'rgba(239,68,68,0.08)',
    },
    {
      label: t('pages.dashboard.highPriority'),
      value: data.high,
      secondary: t('pages.dashboard.escalateWithinSla'),
      icon: '🔴',
      color: 'var(--severity-high)',
      bg: 'rgba(251,146,60,0.08)',
    },
    {
      label: t('pages.dashboard.resolvedThisMonth'),
      value: data.resolved,
      secondary: t('pages.dashboard.remediationCompleted'),
      icon: '✅',
      color: 'var(--severity-low)',
      bg: 'rgba(16,185,129,0.08)',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {cards.map((card, index) => (
        <motion.div
          key={card.label}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 * index, duration: 0.35 }}
          className="rounded-xl border p-5 transition-transform duration-200 hover:-translate-y-1"
          style={{
            background: card.bg,
            borderColor: 'var(--border-primary)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div className="text-xl mb-4">{card.icon}</div>
          <div className="text-3xl font-bold" style={{ color: card.color }}>
            <CountUp end={card.value} duration={1.4} separator="," />
          </div>
          <div className="text-sm font-semibold mt-2" style={{ color: 'var(--text-primary)' }}>
            {card.label}
          </div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
            {card.secondary}
          </div>
        </motion.div>
      ))}
    </div>
  );
}