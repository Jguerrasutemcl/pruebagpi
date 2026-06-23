import { apiClient } from '@/lib/api';
import type { ReportSummary, ReportDetail } from '@/types/report';

const BASE = '/api/v1';

export const reportService = {
  list: (params?: { limit?: number; offset?: number }) =>
    apiClient
      .get<ReportSummary[]>(`${BASE}/reports`, { params })
      .then(r => r.data),

  getById: (reportId: string) =>
    apiClient
      .get<ReportDetail>(`${BASE}/reports/${reportId}`)
      .then(r => r.data),

  // Retorna la URL pública del PDF para abrirla con window.open
  getPdfUrl: (reportId: string): string =>
    `${apiClient.defaults.baseURL ?? ''}/api/v1/reports/${reportId}/pdf`,

  // Descarga el PDF con el token de autorización incluido
  // y lo abre como descarga en el navegador
  downloadPdf: async (reportId: string) => {
    const response = await apiClient.get(
      `${BASE}/reports/${reportId}/pdf`,
      { responseType: 'blob' }
    );
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url  = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href     = url;
    link.download = `reporte-${reportId}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },
};