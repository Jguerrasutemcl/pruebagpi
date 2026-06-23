import { apiClient } from '@/lib/api';

const BASE = '/api/v1';

export interface DashboardSummary {
  active_campaigns: number;
  total_findings: number;
  findings_by_severity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  recent_campaigns: Array<{
    campaign_id: string;
    target: string;
    status: string;
    started_at: string;
  }>;
  total_targets: number;
  total_reports: number;
}

export const dashboardService = {
  getSummary: () =>
    apiClient.get<DashboardSummary>(`${BASE}/dashboard/summary`).then(r => r.data),
};