import { apiClient } from '@/lib/api';

const BASE = '/api/v1';

export interface Finding {
  finding_id: string;
  campaign_id?: string;
  title?: string;
  type: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  description: string;
  evidence?: string;
  status: 'pending' | 'reviewed' | 'false_positive';
  cve?: string;
  host?: string;
  port?: number;
  target?: string;
  remediated?: boolean;
  notes?: string;
  created_at?: string;
}

export interface FindingsResponse {
  findings: Finding[];
  total: number;
  limit: number;
  offset: number;
}

export interface PatchItem {
  finding_id: string;
  type: string;
  severity: string;
  action: string;
  reference?: string;
  remediated: boolean;
}

export interface PatchesResponse {
  items: PatchItem[];
  total: number;
  limit: number;
  offset: number;
}

export const findingService = {
  // Vista global cross-campaign para VulnerabilityHub
  listAll: (filters?: {
    severity?: string;
    status?: string;
    campaign_id?: string;
    limit?: number;
    offset?: number;
  }) =>
    apiClient
      .get<FindingsResponse>(`${BASE}/findings`, { params: filters })
      .then(r => r.data),

  // Actualizar estado de un hallazgo
  updateStatus: (findingId: string, status: 'pending' | 'reviewed' | 'false_positive') =>
    apiClient
      .put<{ finding_id: string; status: string }>(
        `${BASE}/findings/${findingId}/status`,
        { status }
      )
      .then(r => r.data),

  // Vista global de parches para PatchManager
  listPatches: (filters?: {
    status?: string;
    severity?: string;
    limit?: number;
    offset?: number;
  }) =>
    apiClient
      .get<PatchesResponse>(`${BASE}/patches`, { params: filters })
      .then(r => r.data),
};
