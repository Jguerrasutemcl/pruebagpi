# Capa de API — Patrones y Convenciones

## El cliente HTTP (`src/lib/api.ts`)

Hay un único cliente Axios compartido por toda la app:

```ts
import { apiClient } from '@/lib/api';
```

- `baseURL`: `http://localhost:8000` (o lo que tenga `VITE_API_URL` en `.env`)
- `timeout`: 30 segundos
- **Interceptor de request**: añade `Authorization: Bearer <token>` automáticamente si hay usuario logueado en Firebase.
- **Interceptor de response**: loguea en consola si llega un 401.

**No hay que modificar `api.ts` nunca.** Solo importar `apiClient`.

## Patrón para archivos de servicio

Las funciones que llaman a la API **nunca van dentro de los componentes**. Viven en `src/lib/` o `src/services/`.

Ejemplo de referencia — `src/lib/herramientas.ts`:

```ts
import { apiClient } from './api';

export async function listarHerramientas() {
  const { data } = await apiClient.get('/proxy/herramientas');
  return data;
}

export async function ejecutarHerramienta(payload: {
  herramienta: string;
  params?: Record<string, unknown>;
  sesion_id?: number;
  orden_ejecucion?: number;
}) {
  const { data } = await apiClient.post('/proxy/ejecutar', payload);
  return data;
}

export async function obtenerTarea(tareaId: number) {
  const { data } = await apiClient.get(`/proxy/tareas/${tareaId}`);
  return data;
}
```

Reglas del patrón:
- Cada función es `async` y hace destructuring de `{ data }`.
- Los tipos de los parámetros se definen inline o como interfaces exportadas en el mismo archivo.
- Se exporta cada función individualmente (no un objeto default).
- El archivo solo tiene imports de `apiClient` y lógica de HTTP, nada de React.

## Patrón de polling

El orquestador es asíncrono: lanzas una operación y luego consultas el estado periódicamente.

**Implementación correcta con `useEffect`:**

```ts
useEffect(() => {
  // Solo hacer polling si la campaña está en un estado activo
  if (estado.estado !== 'ejecutando' && estado.estado !== 'pausado') return;

  const interval = setInterval(async () => {
    const nuevo = await obtenerEstadoCampaña();
    setEstado(nuevo);
    if (nuevo.estado !== 'ejecutando' && nuevo.estado !== 'pausado') {
      clearInterval(interval);
    }
  }, 3000); // 3 segundos — no usar menos para evitar spam

  return () => clearInterval(interval); // cleanup al desmontar o al cambiar estado
}, [estado.estado]); // dependencia: solo el campo `estado`, no el objeto completo
```

Reglas:
- El `useEffect` depende de `estado.estado` (el string), no del objeto entero.
- Siempre retornar `() => clearInterval(interval)` como cleanup.
- No usar menos de 3000ms de intervalo.
- Limpiar el interval dentro del callback cuando el estado sea terminal (`finalizado`, `detenido`, `error`).

## Manejo de errores HTTP

Los errores del orquestador siguen este formato:

```json
{ "detail": "Ya hay una campaña en curso. Deténla antes de iniciar otra." }
```

Para capturarlos en el componente:

```ts
try {
  await iniciarCampaña(target);
} catch (err) {
  if (axios.isAxiosError(err)) {
    const msg = err.response?.data?.detail ?? 'Error desconocido';
    setError(msg);
  }
}
```

## Nuevo archivo a crear: `src/lib/orquestador.ts`

Este archivo debe seguir exactamente el mismo patrón que `herramientas.ts`. Exportar tipos e interfaces junto con las funciones:

```ts
import { apiClient } from './api';

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

export async function listarReportes(): Promise<ReporteResumen[]> {
  const { data } = await apiClient.get('/campaign/reports');
  return data.reportes;
}

export async function obtenerReporte(id: string): Promise<ReporteCompleto> {
  const { data } = await apiClient.get(`/campaign/reports/${id}`);
  return data;
}
```
