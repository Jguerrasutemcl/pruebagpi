import { formatDistanceToNowStrict } from 'date-fns';
import { es } from 'date-fns/locale';
import type { Severity, TrendDirection, VulnStatus } from './types';

export const severityMeta: Record<Severity, { label: string; color: string; badge: string }> = {
  CRITICAL: {
    label: 'CRITICAL',
    color: 'var(--severity-critical)',
    badge: 'bg-[--severity-critical]/15 text-[--severity-critical] ring-1 ring-[--severity-critical]/30',
  },
  HIGH: {
    label: 'HIGH',
    color: 'var(--severity-high)',
    badge: 'bg-[--severity-high]/15 text-[--severity-high] ring-1 ring-[--severity-high]/30',
  },
  MEDIUM: {
    label: 'MEDIUM',
    color: 'var(--severity-medium)',
    badge: 'bg-[--severity-medium]/15 text-[--severity-medium] ring-1 ring-[--severity-medium]/30',
  },
  LOW: {
    label: 'LOW',
    color: 'var(--severity-low)',
    badge: 'bg-[--severity-low]/15 text-[--severity-low] ring-1 ring-[--severity-low]/30',
  },
};

export const statusColor: Record<VulnStatus, string> = {
  Open: 'var(--severity-critical)',
  'In Progress': 'var(--severity-high)',
  Resolved: 'var(--severity-low)',
};

export function getRiskZoneColor(score: number) {
  if (score < 3) return 'var(--severity-low)';
  if (score < 7) return 'var(--severity-medium)';
  if (score < 8.5) return 'var(--severity-high)';
  return 'var(--severity-critical)';
}

export function getRiskTrendMeta(trend: TrendDirection) {
  if (trend === 'increasing') return { icon: '↑', label: 'Increasing', color: 'var(--severity-high)' };
  if (trend === 'decreasing') return { icon: '↓', label: 'Decreasing', color: 'var(--severity-low)' };
  return { icon: '→', label: 'Stable', color: 'var(--text-muted)' };
}

export function formatRelativeDate(date: string) {
  try {
    return `Hace ${formatDistanceToNowStrict(new Date(date), { locale: es })}`;
  } catch {
    return date;
  }
}

export function sortSeverityWeight(severity: Severity) {
  const order = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
  return order[severity];
}