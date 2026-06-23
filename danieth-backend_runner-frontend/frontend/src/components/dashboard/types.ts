export type Severity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
export type VulnStatus = 'Open' | 'In Progress' | 'Resolved';
export type TrendDirection = 'increasing' | 'decreasing' | 'stable';
export type ScanStatus = 'Running' | 'Paused' | 'Queued';

export interface RiskScoreResponse {
  score: number;
  trend: TrendDirection;
  previous: number;
}

export interface QuickStatsResponse {
  critical: number;
  high: number;
  resolved: number;
}

export interface HeatmapCategory {
  name: string;
  score: number;
  count: number;
  severity: Severity;
  vulnerabilityTab: 'network' | 'applications' | 'servers';
}

export interface Vulnerability {
  cveId: string;
  title: string;
  severity: Severity;
  asset: string;
  detectedDate: string;
  status: VulnStatus;
  cvss: number;
  description: string;
}

export interface PatchSeverityProgress {
  severity: Severity;
  completed: number;
  total: number;
}

export interface PatchProgressResponse {
  overall: {
    completed: number;
    total: number;
    percentage: number;
  };
  bySeverity: PatchSeverityProgress[];
}

export interface ActiveScan {
  id: string;
  target: string;
  progress: number;
  eta: string;
  status: ScanStatus;
}