/**
 * Reemplazo de socket.io-client con polling REST.
 * Implementa todos los métodos que usa Dashboard.tsx:
 * connect, on, off, emit, disconnect.
 */
import { apiClient } from './api';

export function getDashboardSocket() {
  // Mapa de evento → Set de callbacks registrados
  const listeners = new Map<string, Set<(...args: unknown[]) => void>>();
  let polling: ReturnType<typeof setInterval> | null = null;

  const emit = (event: string, ...args: unknown[]) => {
    listeners.get(event)?.forEach(fn => fn(...args));
  };

  return {
    connect: () => {
      // Simula conexión exitosa después de un tick
      // Esto dispara onConnect() en Dashboard y activa liveMode=true
      setTimeout(() => emit('connect'), 100);

      // Polling cada 5s al backend para actualizar widgets
      polling = setInterval(async () => {
        try {
          const { data } = await apiClient.get('/api/v1/dashboard/summary');
          // Mapeamos los datos del summary a los eventos que escucha el Dashboard
          if (data.total_findings !== undefined) {
            emit('dashboard:risk-score', {
              score: data.findings_by_severity?.critical ?? 0,
              previous: 0,
              trend: 'stable',
            });
          }
          if (data.recent_campaigns?.length) {
            emit('dashboard:scan-update', data.recent_campaigns[0]);
          }
        } catch {
          // Silencioso — no rompe la UI
        }
      }, 5000);
    },

    on: (event: string, callback: (...args: unknown[]) => void) => {
      if (!listeners.has(event)) listeners.set(event, new Set());
      listeners.get(event)!.add(callback);
    },

    off: (event: string, callback: (...args: unknown[]) => void) => {
      listeners.get(event)?.delete(callback);
    },

    emit: (_event: string, ..._args: unknown[]) => {},

    disconnect: () => {
      if (polling) { clearInterval(polling); polling = null; }
      emit('disconnect');
      listeners.clear();
    },
  };
}