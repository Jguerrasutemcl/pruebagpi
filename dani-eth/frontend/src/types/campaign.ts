export type CampaignStatus = 'started' | 'running' | 'paused' | 'stopped' | 'finished';
export type FindingStatus = 'pending' | 'reviewed' | 'false_positive';
export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface Finding {
  finding_id: string;
  type: string;
  severity: FindingSeverity;
  description: string;
  evidence: string;
  status: FindingStatus;
  cve: string | null;
  port?: number;
  service?: string;
}

export interface CampaignStatusResponse {
  campaign_id: string;
  status: CampaignStatus;
  phase: string | null;
  progress: number | null;
  findings: Finding[];
  logs: string[];
  started_at: string | null;
  finished_at: string | null;
}

export interface CampaignStart {
  target_id: string;
  target: string;
  scan_type: 'full' | 'quick' | 'custom';
  scope: string[];
}

export interface RemediationItem {
  finding_id: string;
  type: string;
  severity: FindingSeverity;
  action: string;
  reference: string;
  remediated: boolean;
}

export interface RemediationPlan {
  campaign_id: string;
  plan: RemediationItem[];
}

export interface FindingStatusUpdate {
  status: FindingStatus;
}

export interface FindingRemediatedUpdate {
  remediated: boolean;
  notes?: string;
}