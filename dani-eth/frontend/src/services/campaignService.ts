import { apiClient } from '@/lib/api';
import type {
  CampaignStart,
  CampaignStatusResponse,
  FindingStatusUpdate,
  FindingRemediatedUpdate,
  RemediationPlan,
} from '@/types/campaign';

const BASE = '/api/v1';

export const campaignService = {
  start: (body: CampaignStart) =>
    apiClient.post<{ campaign_id: string; status: string; started_at: string }>(
      `${BASE}/campaign/start`, body
    ).then(r => r.data),

  pause: (campaignId: string) =>
    apiClient.post<{ campaign_id: string; status: string }>(
      `${BASE}/campaign/${campaignId}/pause`
    ).then(r => r.data),

  stop: (campaignId: string) =>
    apiClient.post<{ campaign_id: string; status: string }>(
      `${BASE}/campaign/${campaignId}/stop`
    ).then(r => r.data),

  getStatus: (campaignId: string) =>
    apiClient.get<CampaignStatusResponse>(
      `${BASE}/campaign/${campaignId}/status`
    ).then(r => r.data),

  getFindings: (campaignId: string, filters?: { severity?: string; status?: string }) =>
    apiClient.get<{ campaign_id: string; total: number; findings: import('@/types/campaign').Finding[] }>(
      `${BASE}/campaign/${campaignId}/findings`, { params: filters }
    ).then(r => r.data),

  updateFindingStatus: (campaignId: string, findingId: string, body: FindingStatusUpdate) =>
    apiClient.put(
      `${BASE}/campaign/${campaignId}/findings/${findingId}/status`, body
    ).then(r => r.data),

  getRemediationPlan: (campaignId: string) =>
    apiClient.get<RemediationPlan>(
      `${BASE}/campaign/${campaignId}/remediation-plan`
    ).then(r => r.data),

  updateRemediated: (campaignId: string, findingId: string, body: FindingRemediatedUpdate) =>
    apiClient.put(
      `${BASE}/campaign/${campaignId}/findings/${findingId}/remediated`, body
    ).then(r => r.data),

getReport: (campaignId: string) =>
  apiClient.get<{ campaign_id: string; status: string; report_path: string | null; available: boolean }>(
    `${BASE}/campaign/${campaignId}/report`
  ).then(r => r.data),

list: (params?: { limit?: number; offset?: number }) =>
  apiClient
    .get<{
      campaigns: Array<{
        campaign_id: string;
        target_id: string;
        target_address: string;
        status: string;
        started_at: string;
        finished_at: string | null;
      }>;
      total: number;
      limit: number;
      offset: number;
    }>(`${BASE}/campaigns`, { params })
    .then(r => r.data),
};