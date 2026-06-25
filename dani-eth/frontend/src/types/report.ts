export type ReportType = 'technical' | 'executive';

export interface ReportSummary {
  report_id: string;
  campaign_id: string;
  target: string;
  type: ReportType;
  generated_at: string;
  pdf_url?: string | null;
  markdown_url?: string | null;
}

export interface ReportDetail extends ReportSummary {
  // summary puede ser {"markdown": "..."} o estadísticas de hallazgos
  summary: Record<string, unknown> | null;
  findings: Record<string, unknown>[];
}