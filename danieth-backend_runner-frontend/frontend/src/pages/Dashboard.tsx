import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import ActiveScansWidget from '@/components/dashboard/ActiveScansWidget';
import DashboardSkeleton from '@/components/dashboard/DashboardSkeleton';
import PatchProgressWidget from '@/components/dashboard/PatchProgressWidget';
import QuickStatsCards from '@/components/dashboard/QuickStatsCards';
import RecentVulnerabilitiesTable from '@/components/dashboard/RecentVulnerabilitiesTable';
import RiskHeatmap from '@/components/dashboard/RiskHeatmap';
import RiskScoreGauge from '@/components/dashboard/RiskScoreGauge';
import VulnerabilityDrawer from '@/components/dashboard/VulnerabilityDrawer';

import {
  mockActiveScans,
  mockHeatmap,
  mockPatchProgress,
  mockQuickStats,
  mockRecentVulnerabilities,
  mockRiskScore,
} from '@/components/dashboard/mockData';

import type {
  ActiveScan,
  HeatmapCategory,
  PatchProgressResponse,
  QuickStatsResponse,
  RiskScoreResponse,
  Vulnerability,
} from '@/components/dashboard/types';

import { getDashboardSocket } from '@/lib/socket';

function WidgetError({
  title,
  message,
  onRetry,
  retryLabel,
}: {
  title: string;
  message: string;
  onRetry?: () => void;
  retryLabel?: string;
}) {
  return (
    <div
      className="rounded-xl border p-5 h-full"
      style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
    >
      <div className="text-sm font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
        {title}
      </div>
      <p className="text-sm mb-4" style={{ color: 'var(--severity-critical)' }}>
        {message}
      </p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="px-3 py-2 rounded-lg text-xs font-semibold"
          style={{ background: 'rgba(0,212,255,0.08)', color: 'var(--accent-cyan)' }}
        >
          {retryLabel}
        </button>
      )}
    </div>
  );
}

export default function DashboardPage() {
  const { t } = useTranslation();

  const [loading, setLoading] = useState(true);
  const [liveMode, setLiveMode] = useState(false);

  const [riskScore, setRiskScore] = useState<RiskScoreResponse | null>(null);
  const [quickStats, setQuickStats] = useState<QuickStatsResponse | null>(null);
  const [heatmap, setHeatmap] = useState<HeatmapCategory[]>([]);
  const [recentVulns, setRecentVulns] = useState<Vulnerability[]>([]);
  const [patchProgress, setPatchProgress] = useState<PatchProgressResponse | null>(null);
  const [activeScans, setActiveScans] = useState<ActiveScan[]>([]);
  const [selectedVuln, setSelectedVuln] = useState<Vulnerability | null>(null);

  const [riskScoreError, setRiskScoreError] = useState<string | null>(null);
  const [quickStatsError, setQuickStatsError] = useState<string | null>(null);
  const [heatmapError, setHeatmapError] = useState<string | null>(null);
  const [recentError, setRecentError] = useState<string | null>(null);
  const [patchError, setPatchError] = useState<string | null>(null);
  const [scansError, setScansError] = useState<string | null>(null);

  const latestInsertedRef = useRef(0);
  const socketRef = useRef<ReturnType<typeof getDashboardSocket> | null>(null);

  const loadDashboard = () => {
    setLoading(true);

    setTimeout(() => {
      try {
        setRiskScore(mockRiskScore);
        setRiskScoreError(null);
      } catch {
        setRiskScoreError(t('pages.dashboard.riskScoreError'));
      }

      try {
        setQuickStats(mockQuickStats);
        setQuickStatsError(null);
      } catch {
        setQuickStatsError(t('pages.dashboard.quickStatsError'));
      }

      try {
        setHeatmap(mockHeatmap);
        setHeatmapError(null);
      } catch {
        setHeatmapError(t('pages.dashboard.heatmapError'));
      }

      try {
        setRecentVulns(mockRecentVulnerabilities.slice(0, 10));
        setRecentError(null);
      } catch {
        setRecentError(t('pages.dashboard.recentError'));
      }

      try {
        setPatchProgress(mockPatchProgress);
        setPatchError(null);
      } catch {
        setPatchError(t('pages.dashboard.patchError'));
      }

      try {
        setActiveScans(mockActiveScans);
        setScansError(null);
      } catch {
        setScansError(t('pages.dashboard.scansError'));
      }

      setLoading(false);
    }, 900);
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    const socket = getDashboardSocket();
    socketRef.current = socket;

    socket.connect();

    const onConnect = () => {
      setLiveMode(true);
    };

    const onDisconnect = () => {
      setLiveMode(false);
    };

    const onRiskScore = (payload: RiskScoreResponse) => {
      setRiskScore((prev) => ({
        score: payload.score,
        previous: prev?.score ?? payload.previous,
        trend: payload.trend,
      }));
      setRiskScoreError(null);
    };

    const onRecentVulnerability = (payload: Vulnerability) => {
      setRecentVulns((prev) => [payload, ...prev].slice(0, 10));
      setRecentError(null);
    };

    const onScanUpdate = (payload: ActiveScan) => {
      setActiveScans((prev) => {
        const exists = prev.some((scan) => scan.id === payload.id);

        if (!exists) {
          return [payload, ...prev].slice(0, 6);
        }

        return prev.map((scan) => (scan.id === payload.id ? { ...scan, ...payload } : scan));
      });
      setScansError(null);
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('dashboard:risk-score', onRiskScore);
    socket.on('dashboard:recent-vulnerability', onRecentVulnerability);
    socket.on('dashboard:scan-update', onScanUpdate);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('dashboard:risk-score', onRiskScore);
      socket.off('dashboard:recent-vulnerability', onRecentVulnerability);
      socket.off('dashboard:scan-update', onScanUpdate);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!riskScore || liveMode) return;

    const interval = setInterval(() => {
      setRiskScore((prev) => {
        if (!prev) return prev;

        const delta = +(Math.random() * 0.4 - 0.2).toFixed(1);
        const nextScore = Math.min(9.8, Math.max(2.1, +(prev.score + delta).toFixed(1)));

        return {
          score: nextScore,
          previous: prev.score,
          trend: nextScore > prev.score ? 'increasing' : nextScore < prev.score ? 'decreasing' : 'stable',
        };
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [riskScore, liveMode]);

  useEffect(() => {
    if (!activeScans.length || liveMode) return;

    const interval = setInterval(() => {
      setActiveScans((prev) =>
        prev.map((scan) => {
          if (scan.status !== 'Running') return scan;

          const step = Math.floor(Math.random() * 8);
          const nextProgress = Math.min(100, scan.progress + step);

          return {
            ...scan,
            progress: nextProgress,
            eta: nextProgress >= 100 ? 'Completed' : `${Math.max(1, Math.ceil((100 - nextProgress) / 4))} min`,
            status: nextProgress >= 100 ? 'Queued' : scan.status,
          };
        })
      );
    }, 3500);

    return () => clearInterval(interval);
  }, [activeScans.length, liveMode]);

  useEffect(() => {
    if (!recentVulns.length || liveMode) return;

    const interval = setInterval(() => {
      const extraVulns: Vulnerability[] = [
        {
          cveId: 'CVE-2026-9101',
          title: 'Remote Code Execution in Edge Gateway',
          severity: 'CRITICAL',
          asset: 'edge-gateway.company.com',
          detectedDate: new Date().toISOString(),
          status: 'Open',
          cvss: 9.6,
          description: 'Unsafe command execution path allows remote code execution.',
        },
        {
          cveId: 'CVE-2026-9102',
          title: 'SSRF in Internal Metadata Fetcher',
          severity: 'HIGH',
          asset: 'metadata-service.internal',
          detectedDate: new Date().toISOString(),
          status: 'In Progress',
          cvss: 8.2,
          description: 'Metadata fetch endpoint can access internal cloud resources.',
        },
      ];

      const next = extraVulns[latestInsertedRef.current % extraVulns.length];
      latestInsertedRef.current += 1;

      setRecentVulns((prev) => [next, ...prev].slice(0, 10));
    }, 12000);

    return () => clearInterval(interval);
  }, [recentVulns.length, liveMode]);

  const hasCriticalFailure = useMemo(() => {
    return (
      !riskScore &&
      !quickStats &&
      !heatmap.length &&
      !recentVulns.length &&
      !patchProgress &&
      !activeScans.length
    );
  }, [riskScore, quickStats, heatmap.length, recentVulns.length, patchProgress, activeScans.length]);

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (hasCriticalFailure) {
    return (
      <div
        className="rounded-xl border p-6"
        style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
      >
        <h1 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          {t('pages.dashboard.title', 'Dashboard')}
        </h1>
        <p style={{ color: 'var(--severity-critical)' }}>
          {t('pages.dashboard.loadWidgetsError')}
        </p>
        <button
          type="button"
          onClick={loadDashboard}
          className="mt-4 px-4 py-2 rounded-lg text-sm font-semibold"
          style={{ background: 'rgba(0,212,255,0.08)', color: 'var(--accent-cyan)' }}
        >
          {t('pages.dashboard.retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            📊 {t('pages.dashboard.title', 'Dashboard')}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            {t('pages.dashboard.realTimeOverview')}
          </p>
        </div>

        <div
          className="px-3 py-2 rounded-lg text-xs font-semibold"
          style={{
            background: liveMode ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
            color: liveMode ? 'var(--severity-low)' : 'var(--severity-medium)',
          }}
        >
          {liveMode ? t('pages.dashboard.liveConnected') : t('pages.dashboard.mockFallback')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 items-stretch">
        {riskScore && !riskScoreError ? (
          <RiskScoreGauge data={riskScore} />
        ) : (
          <WidgetError
            title={t('pages.dashboard.riskScore')}
            message={riskScoreError ?? t('pages.dashboard.noWidgetData')}
            onRetry={loadDashboard}
            retryLabel={t('pages.dashboard.retry')}
          />
        )}

        {quickStats && !quickStatsError ? (
          <QuickStatsCards data={quickStats} />
        ) : (
          <WidgetError
            title={t('pages.dashboard.quickStats')}
            message={quickStatsError ?? t('pages.dashboard.noWidgetData')}
            onRetry={loadDashboard}
            retryLabel={t('pages.dashboard.retry')}
          />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-4">
        {heatmap.length && !heatmapError ? (
          <RiskHeatmap data={heatmap} />
        ) : (
          <WidgetError
            title={t('pages.dashboard.riskHeatmap')}
            message={heatmapError ?? t('pages.dashboard.noWidgetData')}
            onRetry={loadDashboard}
            retryLabel={t('pages.dashboard.retry')}
          />
        )}

        {patchProgress && !patchError ? (
          <PatchProgressWidget data={patchProgress} />
        ) : (
          <WidgetError
            title={t('pages.dashboard.patchProgress')}
            message={patchError ?? t('pages.dashboard.noWidgetData')}
            onRetry={loadDashboard}
            retryLabel={t('pages.dashboard.retry')}
          />
        )}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-4">
        {recentVulns.length && !recentError ? (
          <RecentVulnerabilitiesTable
            vulnerabilities={recentVulns}
            onSelect={setSelectedVuln}
          />
        ) : (
          <WidgetError
            title={t('pages.dashboard.recentVulnerabilities')}
            message={recentError ?? t('pages.dashboard.noWidgetData')}
            onRetry={loadDashboard}
            retryLabel={t('pages.dashboard.retry')}
          />
        )}

        {activeScans.length && !scansError ? (
          <ActiveScansWidget scans={activeScans} />
        ) : (
          <WidgetError
            title={t('pages.dashboard.activeScans')}
            message={scansError ?? t('pages.dashboard.noWidgetData')}
            onRetry={loadDashboard}
            retryLabel={t('pages.dashboard.retry')}
          />
        )}
      </div>

      <VulnerabilityDrawer vuln={selectedVuln} onClose={() => setSelectedVuln(null)} />
    </div>
  );
}