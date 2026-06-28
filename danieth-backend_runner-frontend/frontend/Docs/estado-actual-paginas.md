# Estado actual de las páginas a modificar

Este documento describe el estado exacto de los dos archivos que deben modificarse,
para que la IA sepa qué preservar y qué reemplazar.

---

## `src/pages/AIPentesting.tsx` — EXTENDER

**Tamaño actual:** ~490 líneas.

**Qué hace hoy:** permite ejecutar herramientas del Runner manualmente (nmap, nuclei,
sqlmap, etc.) con un formulario dinámico generado desde el esquema de cada herramienta.
Tiene su propio sistema de polling para tareas del Runner.

**Estructura del componente principal `AIPentestingPage`:**

```
<div>
  ├── Header (título + descripción)
  ├── Stats (3 cards: herramientas disponibles, ejecutando ahora, completadas)
  ├── Grid 2 columnas:
  │   ├── Lista de herramientas (acordeón con FormularioHerramienta)
  │   └── Panel de resultado (ResultadoViewer)
  └── Logs (terminal de logs de ejecución)
</div>
```

**Subcomponentes definidos en el mismo archivo:**

| Componente | Qué hace |
|---|---|
| `colorEstado(estado)` | Mapea estado de tarea → color CSS |
| `ResultadoViewer` | Renderiza el output de una tarea (nmap, nuclei, sqlmap, curl o fallback raw) |
| `FormularioHerramienta` | Genera un formulario dinámico a partir del `esquema_input` de una herramienta |

**Estado React usado:**

```ts
const [herramientas, setHerramientas]         // Herramienta[]
const [loadingHerramientas, setLoading]        // boolean
const [errorHerramientas, setError]            // string | null
const [tareas, setTareas]                      // Record<number, TareaResultado>
const [ejecutando, setEjecutando]              // Record<number, boolean>
const [seleccionada, setSeleccionada]          // number | null
const [logs, setLogs]                          // LogEntry[]
```

**Qué añadir:** una nueva sección "Orquestador Autónomo" encima o debajo de la sección
de herramientas manuales. Toda la lógica del orquestador debe estar en su propio bloque
de estado y su propia sección JSX, sin tocar el código existente.

**Lo que NO debe tocarse:** nada del estado existente, ni los subcomponentes, ni la
sección de herramientas manuales, ni los logs del runner.

---

## `src/pages/Reports.tsx` — REEMPLAZAR

**Tamaño actual:** 73 líneas — completamente estático, sin lógica.

**Qué hace hoy:** muestra 5 tarjetas hardcodeadas (reportes mock) y un selector de
fecha/formato sin funcionalidad real. Usa keys de i18n del locale pero no consume
ninguna API.

**Todo el contenido actual debe reemplazarse.** Solo conservar:
- La importación de `useTranslation` y el hook `t`
- El `<div className="min-h-full space-y-6">` como wrapper raíz
- El bloque del header (h1 + descripción) — puede actualizarse el texto

**Qué construir en su lugar:**

1. **Lista de reportes** — `GET /campaign/reports` al montar, renderizar cada
   `ReporteResumen` como una fila/card con: fecha, target, iteraciones, botón "Ver reporte".

2. **Vista detalle** — al hacer clic en "Ver reporte", obtener con
   `GET /campaign/reports/{id}` y mostrar el campo `contenido` (markdown)
   usando `react-markdown`.

3. **Estados de carga y error** — spinner mientras carga, mensaje si falla la API.

4. **Estado vacío** — mensaje si la lista viene vacía (sin campañas completadas aún).

---

## Dependencia pendiente de instalar

```bash
npm install react-markdown
```

Esta dependencia **no está instalada** en el proyecto. Debe instalarse antes de
importar `ReactMarkdown` en `Reports.tsx`.
