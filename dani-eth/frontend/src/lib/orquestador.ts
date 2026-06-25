import { apiClient } from './api';

// Tipos
export interface CampaignStatus {
  estado: 'inactivo' | 'ejecutando' | 'pausado' | 'detenido' | 'finalizado' | 'error';
  target: string | null;
  sesion_id: number;
  iteracion_actual: number;
  ruta_reporte: string | null;
  error: string | null;
}

export interface ReporteResumen {
  id: string;
  fecha: string;
  target: string;
  mision: string;
  iteraciones: number | null;
}

export interface ReporteCompleto extends ReporteResumen {
  archivo_md: string;
  contenido: string;
}

// Funciones
export async function iniciarCampaña(target: string, sesion_id?: number): Promise<CampaignStatus> {
  const { data } = await apiClient.post('/campaign/start', { target, sesion_id });
  return data;
}

export async function obtenerEstadoCampaña(): Promise<CampaignStatus> {
  const { data } = await apiClient.get('/campaign/status');
  return data;
}

export async function pausarCampaña(): Promise<CampaignStatus> {
  const { data } = await apiClient.post('/campaign/pause');
  return data;
}

export async function reanudarCampaña(): Promise<CampaignStatus> {
  const { data } = await apiClient.post('/campaign/resume');
  return data;
}

export async function detenerCampaña(): Promise<CampaignStatus> {
  const { data } = await apiClient.post('/campaign/stop');
  return data;
}

export async function listarReportes(): Promise<{ reportes: ReporteResumen[] }> {
  const { data } = await apiClient.get('/campaign/reports');
  return data;
}

export async function obtenerReporte(id: string): Promise<ReporteCompleto> {
  const { data } = await apiClient.get(`/campaign/reports/${id}`);
  return data;
}