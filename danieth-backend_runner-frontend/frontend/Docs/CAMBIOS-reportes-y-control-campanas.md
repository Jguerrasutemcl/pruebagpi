# Reporte de cambios — Reportes + Control de Campañas del Orquestador

> **Para el equipo:** este documento describe **exactamente** qué se modificó en el
> frontend para (1) consumir y mostrar los reportes del orquestador y (2) controlar
> campañas desde la UI. Está pensado para que repliquéis los cambios en **vuestra
> versión** leyendo qué cambió, sin fusionar la rama directamente.
>
> Rama donde se hizo: `feat/nuevas-herramientas`. Todo el trabajo está en `frontend/`.

---

## 0. Resumen de archivos afectados

| Archivo | Tipo de cambio |
|---|---|
| `package.json` / `package-lock.json` | **+2 dependencias** (`react-markdown`, `remark-gfm`) |
| `src/lib/orquestador.ts` | **NUEVO** — capa de datos (tipos + funciones API) |
| `src/locales/es.json` `en.json` `de.json` `fr.json` | claves i18n nuevas (reportes + `common.retry`) |
| `src/pages/Reports.tsx` | **REEMPLAZO** — lista + detalle + render markdown |
| `src/pages/AIPentesting.tsx` | **EXTENSIÓN** — panel "Orquestador Autónomo" |
| `.env` (NO versionado) | `VITE_API_URL` debe apuntar al puerto del orquestador |
| **Orquestador (backend, otro repo)** | requiere **CORS** habilitado (ver §7) |

---

## 1. Dependencias nuevas

```bash
cd frontend
npm install react-markdown remark-gfm
```

Versiones usadas:
- `react-markdown@^10.1.0`
- `remark-gfm@^4.0.1` (imprescindible para que se parseen las **tablas** GFM)

---

## 2. Archivo NUEVO: `src/lib/orquestador.ts`

Capa de datos que habla con el orquestador (sigue el patrón de `src/lib/herramientas.ts`:
nunca se llama a `apiClient` desde un componente). Reutiliza el `apiClient` existente
(`src/lib/api.ts`), que ya inyecta el JWT de Firebase.

```ts
import { apiClient } from './api';

// ============================================================================
// TIPOS
// ============================================================================

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

// ============================================================================
// FUNCIONES DE CAMPAÑA
// ============================================================================

export async function iniciarCampaña(target: string, sesion_id?: number): Promise<CampaignStatus> {
  const { data } = await apiClient.post('/campaign/start', {
    target,
    ...(sesion_id !== undefined && { sesion_id }),
  });
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
  return data.reportes;   // el endpoint envuelve la lista en { reportes: [...] }
}

export async function obtenerReporte(id: string): Promise<ReporteCompleto> {
  const { data } = await apiClient.get(`/campaign/reports/${id}`);
  return data;
}
```

> Nota: los nombres con `ñ` (`iniciarCampaña`, etc.) son identificadores Unicode
> válidos en TS/JS. Si vuestra convención lo prefiere, renombradlos sin acento.

---

## 3. i18n — claves nuevas

### 3.1 En los 4 locales, bajo `pages.reports` (añadir, no reemplazar)

Añadir estas 12 claves al objeto `pages.reports` existente. Valores **es**:

```json
"loading": "Cargando reportes...",
"error": "No se pudieron cargar los reportes. Intenta de nuevo más tarde.",
"empty": "Aún no hay reportes. Completa una campaña para generar uno.",
"backButton": "Volver",
"viewReport": "Ver reporte",
"iterationsLabel": "Iteraciones",
"dateLabel": "Fecha",
"targetLabel": "Target",
"missionLabel": "Misión",
"reportDetail": "Detalle del Reporte",
"reportNotFound": "Reporte no encontrado",
"reportError": "Error al cargar el reporte"
```

Las mismas claves se replicaron en `en.json`, `de.json` y `fr.json` con su traducción.

### 3.2 En los 4 locales, bajo `common` (añadir 1 clave)

`Reports.tsx` usa `t('common.retry')` en el botón de reintentar. Esa clave **no existía**
y hay que añadirla, o el botón muestra el texto literal `common.retry`:

```json
// es                      en          de                    fr
"retry": "Reintentar"   // "Retry"     "Erneut versuchen"     "Réessayer"
```

---

## 4. `src/pages/Reports.tsx` — REEMPLAZO COMPLETO

Se eliminó el contenido mock (las 5 tarjetas hardcodeadas + selectores) y se sustituyó
por la integración real. **Recomendación:** copiad el archivo entero desde la rama. Aquí
va la descripción de su estructura y los **puntos no obvios** que debéis incluir sí o sí.

### 4.1 Estado y lógica del componente

```tsx
// Lista
const [reportes, setReportes] = useState<ReporteResumen[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);
// Detalle
const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteCompleto | null>(null);
const [loadingDetalle, setLoadingDetalle] = useState(false);
const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

useEffect(() => { cargarReportes(); }, []);   // carga al montar (sin polling)
```

- `cargarReportes()` → `listarReportes()` con try/catch/finally (setea `error` si falla).
- `cargarReporte(id)` → `obtenerReporte(id)` con su propio `loadingDetalle`/`errorDetalle`.
- `volverALista()` → resetea `reporteSeleccionado` y `errorDetalle`.

### 4.2 Vista de LISTA (4 estados)
- **loading** → spinner.
- **error** → mensaje + botón `t('common.retry')` que reintenta.
- **vacío** (`reportes.length === 0`) → tarjeta con `t('pages.reports.empty')`.
- **normal** → grid de cards; cada card muestra `fecha`, `target`, `iteraciones`
  (`reporte.iteraciones ?? '—'`), `mision` truncada, y botón "Ver reporte".

### 4.3 Vista de DETALLE
- Botón "← Volver", cabecera con fecha/target/iteraciones/misión.
- Render del `contenido` markdown (ver §4.4).

### 4.4 ⚠️ EL PUNTO CLAVE: render del markdown

El orquestador (LLM) **envuelve todo el reporte en un fence** ```` ```markdown … ``` ````.
Si se pasa tal cual a `react-markdown`, lo trata como **un único bloque de código** y se
ve el markdown crudo (los `#`, `##` y los `|` de las tablas en monoespaciado).

Hay que hacer **3 cosas**:

**(a)** Desenvolver el fence antes de renderizar:

```tsx
function limpiarMarkdown(contenido: string): string {
  const texto = contenido.trim();
  const fence = texto.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  return fence ? fence[1] : contenido;   // si no viene envuelto, lo deja igual
}
```

**(b)** Activar `remark-gfm` (sin esto las **tablas** no se parsean):

```tsx
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
```

**(c)** Pasar un mapa `components` con estilos, porque Tailwind resetea los headings y el
proyecto **no** tiene el plugin Typography (`prose` no sirve). Estilad con las variables
CSS del tema (`var(--text-primary)`, `var(--accent-cyan)`, `var(--border-primary)`, etc.)
los elementos: `h1 h2 h3 p ul ol li a strong blockquote code pre table th td hr`.

Uso final en el JSX del detalle:

```tsx
<ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
  {limpiarMarkdown(reporteSeleccionado.contenido)}
</ReactMarkdown>
```

> El objeto `markdownComponents` completo está en el archivo `Reports.tsx` de la rama;
> copiadlo tal cual. Es ~60 líneas de wrappers con estilos inline.

---

## 5. `src/pages/AIPentesting.tsx` — EXTENSIÓN (no reemplazar)

Se **añadió** una sección "Orquestador Autónomo" con los botones de control de campaña.
**No se tocó** la funcionalidad existente de herramientas manuales del runner.

### 5.1 Import nuevo (arriba del archivo)

```tsx
import {
  iniciarCampaña, obtenerEstadoCampaña, pausarCampaña,
  reanudarCampaña, detenerCampaña, type CampaignStatus,
} from '@/lib/orquestador';
```

### 5.2 Componente nuevo `ControlCampaña` (inline, antes de `AIPentestingPage`)

Componente autónomo que:
- Tiene `input` de target + botón **Iniciar campaña** (`iniciarCampaña`), deshabilitado si
  no hay target o si ya hay campaña en curso.
- Botones **Pausar** / **Reanudar** / **Detener**, habilitados según el estado:
  `ejecutando` → Pausar+Detener; `pausado` → Reanudar+Detener.
- Botón **Estado** (`obtenerEstadoCampaña`) que consulta el status **bajo demanda**.
- Panel que muestra `estado` (con color), `target`, `iteracion_actual`, `sesion_id`.
- Muestra el `detail` de error del orquestador (incl. `409 "ya hay una campaña en curso"`).
- `useEffect` que consulta el estado **una vez al montar**. **Sin polling automático ni
  notificaciones** (decisión explícita: no avisamos al front cuando termina, no se muestra
  el output/printf del orquestador).

Helper de estado→color usado en el panel:

```tsx
const COLOR_ESTADO_CAMPANA: Record<CampaignStatus['estado'], string> = {
  inactivo: 'var(--text-muted)',     ejecutando: 'var(--accent-cyan)',
  pausado: 'var(--severity-medium)', detenido: 'var(--text-muted)',
  finalizado: 'var(--severity-low)', error: 'var(--severity-critical)',
};
```

Núcleo de la lógica de acciones (cada botón llama a esto):

```tsx
async function ejecutar(accion: string, fn: () => Promise<CampaignStatus>) {
  setCargando(accion);
  setError(null);
  try {
    setStatus(await fn());
  } catch (e) {
    const detail = (e as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
    setError(detail ?? 'Error al ejecutar la acción');
  } finally {
    setCargando(null);
  }
}
```

> El JSX completo de `ControlCampaña` (~120 líneas) y el botón reutilizable `BotonAccion`
> están en el archivo de la rama; copiadlos tal cual.

### 5.3 Insertar el componente en el render

Dentro del `return` de `AIPentestingPage`, justo **debajo del header** y antes de los Stats:

```tsx
{/* Orquestador Autónomo — control de campañas */}
<ControlCampaña />
```

---

## 6. Configuración: `.env` (NO versionado)

`VITE_API_URL` debe apuntar al **puerto donde corre el orquestador** (el de los endpoints
`/campaign/*`). En nuestro entorno es **8000**, sin barra final:

```
VITE_API_URL=http://localhost:8000
```

Avisos importantes:
- **Sin** barra final.
- Vite **no recarga `.env` en caliente**: tras cambiarlo hay que **reiniciar** `npm run dev`.
- Síntoma de puerto equivocado: el orquestador responde `200` pero la UI da error, o un
  `404` en `/campaign/reports` (estáis pegándole a otro servicio).

---

## 7. Prerrequisito del backend: CORS en el orquestador

El frontend (`localhost:5173`) y el orquestador (`localhost:8000`) son **orígenes
distintos**, y el front manda el header `Authorization: Bearer <JWT Firebase>`, lo que
obliga a preflight CORS. **El orquestador debe tener `CORSMiddleware`** o el navegador
bloquea las respuestas (aunque el server devuelva `200`):

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # origen del frontend
    allow_methods=["*"],
    allow_headers=["*"],                      # imprescindible para 'Authorization'
)
```

- `allow_headers=["*"]` es clave (si no, el preflight rechaza `Authorization`).
- **No** combinar `allow_origins=["*"]` con `allow_credentials=True` (inválido por spec).
- En prod, añadir el dominio real del front a `allow_origins`.

---

## 8. Contrato de la API del orquestador (referencia rápida)

```
POST /campaign/start    body {target, sesion_id?}  → 200 CampaignStatus | 409 {detail}
GET  /campaign/status                               → 200 CampaignStatus (siempre)
POST /campaign/pause | /resume | /stop              → 200 CampaignStatus | 409 {detail}
GET  /campaign/reports                              → 200 { reportes: ReporteResumen[] }
GET  /campaign/reports/{id}                         → 200 ReporteCompleto | 404 {detail}
```

`iteraciones` puede ser `null` (reportes viejos) → mostrar `"—"`.
`contenido` viene en markdown, normalmente envuelto en un fence ```` ``` ```` (ver §4.4).

---

## 9. Checklist de implementación para el equipo

- [ ] `npm install react-markdown remark-gfm`
- [ ] Crear `src/lib/orquestador.ts` (§2)
- [ ] Añadir claves i18n en los 4 locales: 12 en `pages.reports` + `common.retry` (§3)
- [ ] Reemplazar `src/pages/Reports.tsx`, incluyendo `limpiarMarkdown` + `remarkGfm` +
      `components` (§4)
- [ ] Extender `src/pages/AIPentesting.tsx` con `ControlCampaña` (§5)
- [ ] Configurar `VITE_API_URL` al puerto del orquestador y reiniciar dev server (§6)
- [ ] Verificar que el **orquestador** tenga CORS (§7)
- [ ] Probar: `npx tsc -b` sin errores nuevos, lista de reportes carga, detalle renderiza
      con títulos/tablas, y los botones de campaña responden.
```
