# Reporte de métricas — 2026-06-29 20:47:33

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

=== PROFUNDIDAD: ESTÁNDAR ===

Opera con los siguientes límites:
- Máximo de iteraciones del Explorer: 5.
- Puedes usar el rango completo de herramientas disponibles en el runner.
- Balancea cobertura y profundidad: escanea los puertos más comunes primero,
  luego profundiza en los servicios que muestren mayor superficie de ataque.
- El Judge debe aprobar cuando hayas cubierto los servicios principales con
  suficiente detalle para tomar decisiones informadas.

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
- **Duración total:** 1m 5s
- **Resultado:** ❌ No  ·  **Motivo de término:** `detenido_usuario`

## Resumen ejecutivo

| Métrica | Valor |
|---|---|
| Iteraciones | 1 |
| Llamadas al LLM | 11 |
| Tokens totales | 27,696 (entrada 22,713 / salida 4,983) |
| Costo estimado LLM | ~$0.0116 USD |
| Tareas ejecutadas (runner) | 5 |
| Tasa de éxito de ejecución | 100% (5/5) |
| Tiempo en LLM / runner | 48s / 14s |

> El costo es **estimado** con tarifas orientativas de DeepSeek ($0.27/1M entrada, $1.1/1M salida); ajústalas en `metricas/collector.py`.

## Tiempo

![Distribución del tiempo](tiempo_distribucion.png)

## Consumo de LLM (tokens y costo)

![Tokens por agente](tokens_por_agente.png)

| Agente | Llamadas | Prompt | Completion | Total |
|---|---|---|---|---|
| Explorador | 3 | 8,895 | 1,298 | 10,193 |
| Summarizer | 5 | 7,473 | 2,148 | 9,621 |
| Selector | 1 | 2,547 | 291 | 2,838 |
| Comandante | 1 | 2,587 | 176 | 2,763 |
| Reportador | 1 | 1,211 | 1,070 | 2,281 |

## Coordinación del Commander

Decisiones de orquestación (qué fase asignó en cada paso):

| # | Decisión | Razón |
|---|---|---|
| 1 | asignar `exploracion` | Es la primera fase de la campaña. Necesitamos descubrir qué servicios, puertos y rutas están expuestos en localhost antes de poder evaluar la superficie de ataque. Se operará en modo solo reconocimiento, respetando las restricciones de no explotación y sin pivoting. |

> El Commander **no** asignó la fase de explotación.

## Eficiencia del Summarizer (memoria estructurada)

![Ahorro de contexto del Summarizer](summarizer_ahorro.png)

Tras 5 comando(s): crudo acumulado **1,473** chars vs memoria **1,557** chars → compresión **0.9×** (~-6% menos contexto que arrastrar todo el transcript).

## Iteraciones y decisiones (IA ↔ Juez)

![Tareas por iteración](tareas_por_iteracion.png)

| Fase | Iteración | Tareas | Decisión IA | Decisión Juez |
|---|---|---|---|---|
| exploracion | 1 | 7 | — | — |

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
| curl | 2 | 2 | 0 | 2.8s |
| nmap | 3 | 3 | 0 | 2.8s |

## Cobertura final (KB del Explorador)

| Categoría | Cantidad |
|---|---|
| servicios | 0 |
| rutas | 0 |
| archivos | 0 |
| flags | 0 |
| hallazgos | 3 |
| pendientes | 2 |
| descartado | 5 |
