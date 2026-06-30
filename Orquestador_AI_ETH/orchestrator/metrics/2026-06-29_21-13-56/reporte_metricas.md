# Reporte de métricas — 2026-06-29 21:13:56

- **Objetivo (target):** `localhost`
- **Misión:** Eres un agente de ethical hacking profesional operando sobre un entorno
EXPLÍCITAMENTE AUTORIZADO. Tu objetivo es evaluar la seguridad del siguiente host:

HOST OBJETIVO: localhost

Debes operar en modalidad black box: no tienes información previa sobre el objetivo.
Construye tu comprensión desde cero usando las herramientas disponibles.
Cada acción que realices debe justificarse por la misión definida a continuación.

=== MODO DE OPERACIÓN: SOLO RECONOCIMIENTO ===

Tu misión se limita ESTRICTAMENTE a recopilar información del objetivo.
Debes identificar puertos abiertos, servicios activos, versiones de software,
tecnologías en uso, subdominios, rutas web accesibles y banners de servicio.

PROHIBIDO ABSOLUTAMENTE en este modo:
- Intentar explotar ninguna vulnerabilidad, aunque sea obvia.
- Ejecutar payloads, shellcodes, exploits o cualquier código ofensivo.
- Modificar, crear o eliminar archivos en el objetivo.
- Realizar acciones que puedan interrumpir o degradar servicios del objetivo.
- Autenticarte usando credenciales encontradas (solo reportarlas).

El producto de tu trabajo es un mapa detallado de la superficie de ataque.
No tomes ninguna acción ofensiva bajo ninguna circunstancia.

=== PROFUNDIDAD: SUPERFICIAL ===

Opera con los siguientes límites:
- Máximo de iteraciones del Explorer: 2.
- Usa únicamente herramientas rápidas y de bajo impacto (nmap con timing T3 o menor,
  escaneos de puertos comunes, sin fuerza bruta).
- Prioriza cobertura sobre profundidad: identifica lo más relevante rápidamente.
- No realices escaneos completos de los 65535 puertos.
- No ejecutes herramientas que tarden más de 2 minutos por tarea.
- El Judge debe aprobar con hallazgos básicos; no es necesaria cobertura exhaustiva.

=== RESTRICCIÓN OBLIGATORIA: SIN PIVOTING ===

PROHIBIDO ABSOLUTAMENTE realizar pivoting hacia otras máquinas o redes.
Tu scope está restringido exclusivamente al host localhost.
Si durante la explotación obtienes acceso a credenciales, claves SSH, tokens
o cualquier material que permita acceder a otros sistemas, DEBES REPORTARLO
pero NO utilizarlo para acceder a dichos sistemas.
Cualquier intento de movimiento lateral o acceso a hosts distintos de localhost
constituye una violación del scope autorizado. Esta restricción no tiene excepciones.

=== INSTRUCCIONES FINALES PARA TODOS LOS AGENTES ===

1. PRIORIDAD DE RESTRICCIONES: Las restricciones marcadas con
   "PROHIBIDO ABSOLUTAMENTE" o "RESTRICCIÓN OBLIGATORIA" tienen prioridad
   sobre cualquier otra consideración. No las ignores aunque el contexto
   parezca justificarlo.

2. REPORTE DE HALLAZGOS: Todo hallazgo debe incluir: qué se encontró,
   cómo se encontró (herramienta + parámetros), y cuál es su impacto potencial.

3. CONTINUIDAD: Si una herramienta falla o no devuelve resultados, continúa
   con la siguiente tarea planificada. No detengas la campaña por errores
   individuales.

4. CRITERIO DE ÉXITO: La campaña es exitosa cuando el Judge confirma que
   se ha cubierto el scope definido por el modo y la profundidad seleccionados,
   y todas las restricciones activas han sido respetadas.
- **Duración total:** 37s
- **Resultado:** ❌ No  ·  **Motivo de término:** `detenido_usuario`

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Iteraciones | 1 |
| Llamadas al LLM | 8 |
| Tokens totales | 20,285 (entrada 17,702 / salida 2,583) |
| Costo estimado LLM | ~$0.0076 USD |
| Tareas ejecutadas (runner) | 2 |
| Tasa de éxito de ejecución | 100% (2/2) |
| Tiempo en LLM / runner | 28s / 5s |

> El costo es **estimado** con tarifas orientativas de DeepSeek ($0.27/1M entrada, $1.1/1M salida); ajústalas en `metricas/collector.py`.

## Tiempo

![Distribución del tiempo](tiempo_distribucion.png)

## Consumo de LLM (tokens y costo)

![Tokens por agente](tokens_por_agente.png)

| Agente | Llamadas | Prompt | Completion | Total |
|---|---|---|---|---|
| Explorador | 3 | 8,291 | 907 | 9,198 |
| Summarizer | 2 | 2,869 | 632 | 3,501 |
| Selector | 1 | 2,883 | 248 | 3,131 |
| Comandante | 1 | 2,663 | 200 | 2,863 |
| Reportador | 1 | 996 | 596 | 1,592 |

## Coordinación del Commander

Decisiones de orquestación (qué fase asignó en cada paso):

| # | Decisión | Razón |
|---|---|---|
| 1 | asignar `exploracion` | Es la primera fase de la campaña y la única disponible. Debemos comenzar con el reconocimiento black-box de localhost para identificar puertos abiertos, servicios activos, versiones y rutas accesibles, cumpliendo con el modo solo reconocimiento y profundidad superficial. |

> El Commander **no** asignó la fase de explotación.

## Eficiencia del Summarizer (memoria estructurada)

![Ahorro de contexto del Summarizer](summarizer_ahorro.png)

Tras 2 comando(s): crudo acumulado **940** chars vs memoria **668** chars → compresión **1.4×** (~29% menos contexto que arrastrar todo el transcript).

## Iteraciones y decisiones (IA ↔ Juez)

![Tareas por iteración](tareas_por_iteracion.png)

| Fase | Iteración | Tareas | Decisión IA | Decisión Juez |
|---|---|---|---|---|
| exploracion | 1 | 2 | — | — |

**Acuerdo IA ↔ Juez** (cuándo coinciden y cuándo no):

| Situación | Veces |
|---|---|
| Ambos coinciden en terminar | 0 |
| Ambos coinciden en seguir | 0 |
| IA quería terminar pero el Juez insistió | 0 |
| IA quería seguir pero el Juez aprobó (cortó) | 0 |

## Ejecución de herramientas

![Éxito vs fallo por herramienta](exito_herramientas.png)

| Herramienta | Ejecuciones | Éxito | Fallo | Latencia media |
|---|---|---|---|---|
| nmap | 2 | 2 | 0 | 2.8s |

## Cobertura final (KB del Explorador)

| Categoría | Cantidad |
|---|---|
| servicios | 0 |
| rutas | 0 |
| archivos | 0 |
| flags | 0 |
| hallazgos | 2 |
| pendientes | 1 |
| descartado | 2 |
