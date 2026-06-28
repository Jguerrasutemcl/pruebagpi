import { useCallback, useEffect, useRef, useState } from 'react';
import { obtenerLogs, type CampaignEvent } from '@/lib/orquestador';

// Hook de polling incremental de la timeline de la campaña.
// `activo` = true mientras la campaña esté en 'ejecutando' o 'pausado'.
//
// Llama a `reset()` justo antes de disparar un POST /campaign/start nuevo, para
// no mezclar la timeline de la campaña anterior (el bus del backend se vacía y el
// cursor reinicia en 0).
export function useCampaignLogs(activo: boolean) {
  const [eventos, setEventos] = useState<CampaignEvent[]>([]);
  const cursor = useRef(0);

  const reset = useCallback(() => {
    cursor.current = 0;
    setEventos([]);
  }, []);

  useEffect(() => {
    if (!activo) return;
    let cancelado = false;

    const tick = async () => {
      try {
        const { eventos: nuevos, total } = await obtenerLogs(cursor.current);
        if (cancelado) return;
        if (nuevos.length > 0) {
          setEventos(prev => [...prev, ...nuevos]);
          cursor.current = total;
        }
      } catch {
        /* reintenta en el próximo tick */
      }
    };

    tick(); // primera carga inmediata
    const interval = setInterval(tick, 2500);
    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [activo]);

  return { eventos, reset };
}
