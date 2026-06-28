import { orquestadorClient as apiClient } from './api';

// ============================================================================
// TIPOS
// ============================================================================

export type Modo =
  | 'solo_reconocimiento'
  | 'reconocimiento_vulnerabilidades'
  | 'reconocimiento_explotacion';

export type Profundidad = 'superficial' | 'estandar' | 'exhaustivo';

export interface Restricciones {
  no_pivoting: boolean;
  modo_ctf: boolean;
  flag_format: string;
  solo_reportar_criticos: boolean;
  stealth: boolean;
}

export interface CampaignStatus {
  estado: 'inactivo' | 'ejecutando' | 'pausado' | 'detenido' | 'finalizado' | 'error';
  target: string | null;
  sesion_id: number;
  modo: Modo | null;
  profundidad: Profundidad | null;
  restricciones: Restricciones | null;
  iteracion_actual: number;
  ruta_reporte: string | null;
  error: string | null;
}

export interface IniciarCampañaResponse extends CampaignStatus {
  advertencias: Array<{ campo: string; mensaje: string }>;
}

export const RESTRICCIONES_DEFAULT: Restricciones = {
  no_pivoting: true,
  modo_ctf: false,
  flag_format: 'FLAG{...}',
  solo_reportar_criticos: false,
  stealth: false,
};

export interface IniciarCampañaParams {
  target: string;
  sesion_id?: number;
  modo?: Modo;
  profundidad?: Profundidad;
  restricciones?: Partial<Restricciones>;
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

// ============================================================================
// TIMELINE DE EVENTOS EN VIVO
// ============================================================================

export interface CampaignEvent {
  id: number;
  timestamp: string;
  tipo: string;
  agente: 'commander' | 'explorer' | 'judge' | 'selector' | 'summarizer' | string;
  fase: string | null;
  iteracion: number | null;
  datos: Record<string, unknown>;
}

export interface LogsResponse {
  eventos: CampaignEvent[];
  total: number;
}

// ============================================================================
// FUNCIONES DE CAMPAÑA
// ============================================================================

export async function iniciarCampaña(
  params: IniciarCampañaParams
): Promise<IniciarCampañaResponse> {
  const { data } = await apiClient.post('/campaign/start', params);
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

// ============================================================================
// FUNCIONES DE REPORTES
// ============================================================================

export async function listarReportes(): Promise<ReporteResumen[]> {
  const { data } = await apiClient.get('/campaign/reports');
  return data.reportes;
}

export async function obtenerReporte(id: string): Promise<ReporteCompleto> {
  const { data } = await apiClient.get(`/campaign/reports/${id}`);
  return data;
}

// ============================================================================
// FUNCIONES DE TIMELINE
// ============================================================================

export async function obtenerLogs(desde = 0): Promise<LogsResponse> {
  const { data } = await apiClient.get('/campaign/logs', { params: { desde } });
  return data;
}
