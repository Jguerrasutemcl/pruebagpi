export type ReportType = 'technical' | 'executive';

export interface FindingSeveritySummary {
  total_findings: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
}

export interface ReportSummary {
  report_id: string;
  campaign_id: string;
  target: string;
  type: ReportType;
  generated_at: string;
}

export interface ReportDetail extends ReportSummary {
  summary: FindingSeveritySummary;
  findings: Record<string, unknown>[];
}