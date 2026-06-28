import { useEffect, useRef, useState } from 'react';
import type { ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { CampaignEvent } from '@/lib/orquestador';

// ============================================================================
// Helpers
// ============================================================================

const ICONO_AGENTE: Record<string, string> = {
  commander: '🛰️',
  explorer: '🔍',
  judge: '⚖️',
  selector: '🎯',
  summarizer: '🧠',
};

function iconoAgente(agente: string): string {
  return ICONO_AGENTE[agente] ?? '🤖';
}

function hora(timestamp: string): string {
  const d = new Date(timestamp);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString();
}

// Markdown compacto reutilizado para reportes de iteración.
const markdownComponents = {
  h1: (props: ComponentProps<'h1'>) => (
    <h1 className="text-base font-bold mt-3 mb-2 pb-1 border-b" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }} {...props} />
  ),
  h2: (props: ComponentProps<'h2'>) => (
    <h2 className="text-sm font-bold mt-3 mb-2" style={{ color: 'var(--text-primary)' }} {...props} />
  ),
  h3: (props: ComponentProps<'h3'>) => (
    <h3 className="text-sm font-bold mt-2 mb-1" style={{ color: 'var(--accent-cyan)' }} {...props} />
  ),
  p: (props: ComponentProps<'p'>) => <p className="my-2" style={{ color: 'var(--text-secondary)' }} {...props} />,
  ul: (props: ComponentProps<'ul'>) => <ul className="list-disc pl-5 my-2 space-y-1" style={{ color: 'var(--text-secondary)' }} {...props} />,
  ol: (props: ComponentProps<'ol'>) => <ol className="list-decimal pl-5 my-2 space-y-1" style={{ color: 'var(--text-secondary)' }} {...props} />,
  li: (props: ComponentProps<'li'>) => <li className="leading-relaxed" {...props} />,
  strong: (props: ComponentProps<'strong'>) => <strong className="font-bold" style={{ color: 'var(--text-primary)' }} {...props} />,
  code: (props: ComponentProps<'code'>) => (
    <code className="px-1 py-0.5 rounded font-mono" style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-cyan)' }} {...props} />
  ),
  pre: (props: ComponentProps<'pre'>) => (
    <pre className="p-2 rounded my-2 overflow-x-auto font-mono" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }} {...props} />
  ),
  a: (props: ComponentProps<'a'>) => (
    <a className="underline hover:opacity-80" style={{ color: 'var(--accent-cyan)' }} target="_blank" rel="noreferrer" {...props} />
  ),
  table: (props: ComponentProps<'table'>) => (
    <div className="overflow-x-auto my-2">
      <table className="w-full border-collapse" style={{ color: 'var(--text-secondary)' }} {...props} />
    </div>
  ),
  th: (props: ComponentProps<'th'>) => (
    <th className="text-left px-2 py-1 font-bold border" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }} {...props} />
  ),
  td: (props: ComponentProps<'td'>) => <td className="px-2 py-1 border" style={{ borderColor: 'var(--border-primary)' }} {...props} />,
};

function limpiarMarkdown(contenido: string): string {
  const texto = contenido.trim();
  const fence = texto.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  return fence ? fence[1] : contenido;
}

// Panel colapsable para outputs largos (tool_result, reportes).
function Colapsable({
  titulo,
  abiertoInicial = false,
  children,
  color,
}: {
  titulo: React.ReactNode;
  abiertoInicial?: boolean;
  children: React.ReactNode;
  color?: string;
}) {
  const [abierto, setAbierto] = useState(abiertoInicial);
  return (
    <div className="rounded border overflow-hidden" style={{ borderColor: 'var(--border-primary)' }}>
      <button
        onClick={() => setAbierto(a => !a)}
        className="w-full flex items-center justify-between px-3 py-2 text-left"
        style={{ background: 'var(--bg-tertiary)', color: color ?? 'var(--text-secondary)' }}
      >
        <span className="text-xs font-medium">{titulo}</span>
        <span style={{ color: 'var(--text-muted)' }}>{abierto ? '▲' : '▼'}</span>
      </button>
      {abierto && <div className="p-3" style={{ background: 'var(--bg-primary)' }}>{children}</div>}
    </div>
  );
}

function Badge({ texto, color }: { texto: string; color: string }) {
  return (
    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold" style={{ background: 'rgba(255,255,255,0.06)', color }}>
      {texto}
    </span>
  );
}

// ============================================================================
// Renderizadores por tipo de evento
// ============================================================================

function CuerpoEvento({ evento }: { evento: CampaignEvent }) {
  const d = evento.datos as Record<string, unknown>;
  const str = (v: unknown) => (v == null ? '' : String(v));

  switch (evento.tipo) {
    case 'campaign_start':
      return (
        <div className="p-3 rounded" style={{ background: 'rgba(0,212,255,0.08)', borderLeft: '3px solid var(--accent-cyan)' }}>
          <div className="text-sm font-bold" style={{ color: 'var(--accent-cyan)' }}>🚀 Campaña iniciada — {str(d.target)}</div>
          {d.mision != null && <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{str(d.mision)}</div>}
        </div>
      );

    case 'phase_start':
      return (
        <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--accent-blue)' }}>
          <span className="font-bold">▶ Fase: {str(d.fase)}</span>
          {d.descripcion != null && <span className="text-xs" style={{ color: 'var(--text-muted)' }}>— {str(d.descripcion)}</span>}
        </div>
      );

    case 'phase_end':
      return (
        <div className="text-sm" style={{ color: 'var(--accent-blue)' }}>
          ■ Fin de fase: {str(d.fase)}{' '}
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>({str(d.reportes_recibidos)} reportes)</span>
        </div>
      );

    case 'campaign_end':
      return (
        <div className="p-3 rounded" style={{ background: 'rgba(0,255,136,0.08)', borderLeft: '3px solid var(--severity-low)' }}>
          <div className="text-sm font-bold" style={{ color: 'var(--severity-low)' }}>✅ Campaña finalizada</div>
          <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>
            {str(d.fases_completadas)} fases · {str(d.total_reportes)} reportes
          </div>
          {d.ruta_reporte != null && (
            <div className="text-xs mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>{str(d.ruta_reporte)}</div>
          )}
        </div>
      );

    case 'campaign_aborted':
      return (
        <div className="p-3 rounded" style={{ background: 'rgba(255,71,87,0.08)', borderLeft: '3px solid var(--severity-critical)' }}>
          <div className="text-sm font-bold" style={{ color: 'var(--severity-critical)' }}>⛔ Campaña detenida — {str(d.motivo)}</div>
          {d.detalle != null && <div className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{str(d.detalle)}</div>}
        </div>
      );

    case 'tool_selection': {
      const elegidas = Array.isArray(d.elegidas) ? (d.elegidas as unknown[]).map(str) : [];
      return (
        <div className="text-xs" style={{ color: 'var(--text-secondary)' }}>
          <span style={{ color: 'var(--text-muted)' }}>🎯 Herramientas para </span>
          <span className="font-bold">{str(d.rol)}</span>
          {d.fallback === true && <span style={{ color: 'var(--severity-medium)' }}> (fallback)</span>}
          <div className="flex flex-wrap gap-1 mt-1">
            {elegidas.map((h, i) => <Badge key={i} texto={h} color="var(--accent-blue)" />)}
          </div>
          {d.razon != null && <div className="mt-1" style={{ color: 'var(--text-muted)' }}>{str(d.razon)}</div>}
        </div>
      );
    }

    case 'stage':
      return (
        <Badge texto={`◆ ${str(d.etapa)}`} color="var(--text-muted)" />
      );

    case 'tasks_planned': {
      const tareas = Array.isArray(d.tareas) ? (d.tareas as Array<Record<string, unknown>>) : [];
      return (
        <Colapsable titulo={`📋 ${str(d.cantidad)} tareas planificadas`} color="var(--text-secondary)">
          <div className="space-y-1 text-xs font-mono" style={{ color: 'var(--text-secondary)' }}>
            {tareas.map((t, i) => (
              <div key={i}>
                <span style={{ color: 'var(--accent-blue)' }}>{str(t.herramienta)}</span>
                <span style={{ color: 'var(--text-muted)' }}> {JSON.stringify(t.params ?? {})}</span>
              </div>
            ))}
          </div>
        </Colapsable>
      );
    }

    case 'task_start':
      return (
        <div className="flex items-center gap-2 text-xs">
          <span style={{ color: 'var(--text-muted)' }}>#{str(d.numero)}</span>
          <Badge texto={str(d.herramienta)} color="var(--accent-blue)" />
          <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{JSON.stringify(d.params ?? {})}</span>
        </div>
      );

    case 'task_skipped':
      return (
        <div className="text-xs" style={{ color: 'var(--severity-medium)' }}>
          ⤬ Tarea #{str(d.numero)} omitida (sin herramienta)
        </div>
      );

    case 'tool_call':
      return (
        <div className="flex items-center gap-2 text-xs">
          <span style={{ color: 'var(--text-muted)' }}>⚡ invoca</span>
          <Badge texto={str(d.herramienta)} color="var(--accent-blue)" />
          <span className="font-mono" style={{ color: 'var(--text-muted)' }}>{JSON.stringify(d.params ?? {})}</span>
        </div>
      );

    case 'tool_result':
      return (
        <Colapsable titulo={`📤 Output de ${str(d.herramienta)} (${str(d.chars)} chars)`} color="var(--text-secondary)">
          <pre className="text-xs whitespace-pre-wrap overflow-auto font-mono" style={{ color: 'var(--text-secondary)', maxHeight: '320px' }}>
            {str(d.output) || '(sin output)'}
          </pre>
        </Colapsable>
      );

    case 'memory_update':
      return (
        <div className="text-xs flex items-center gap-3" style={{ color: 'var(--text-muted)' }}>
          🧠 <span><span style={{ color: 'var(--text-secondary)' }}>{str(d.comandos_acumulados)}</span> cmds</span>
          <span>{str(d.chars_crudo)} → <span style={{ color: 'var(--text-secondary)' }}>{str(d.chars_memoria)}</span> chars</span>
        </div>
      );

    case 'report_generated':
      return (
        <Colapsable titulo="📝 Reporte de iteración" color="var(--text-secondary)">
          <div className="text-xs">
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
              {limpiarMarkdown(str(d.reporte))}
            </ReactMarkdown>
          </div>
        </Colapsable>
      );

    case 'iteration_decision': {
      const continuar = d.continuar === true;
      return (
        <div className="text-xs flex items-center gap-2">
          <Badge
            texto={continuar ? '↻ continuar' : '✓ terminar'}
            color={continuar ? 'var(--accent-cyan)' : 'var(--severity-medium)'}
          />
          {d.razon != null && <span style={{ color: 'var(--text-muted)' }}>{str(d.razon)}</span>}
        </div>
      );
    }

    case 'judge_verdict': {
      const aprobado = d.aprobado === true;
      return (
        <div
          className="p-3 rounded text-xs"
          style={{
            background: aprobado ? 'rgba(0,255,136,0.06)' : 'rgba(255,71,87,0.06)',
            borderLeft: `3px solid ${aprobado ? 'var(--severity-low)' : 'var(--severity-high)'}`,
          }}
        >
          <div className="font-bold" style={{ color: aprobado ? 'var(--severity-low)' : 'var(--severity-high)' }}>
            {aprobado ? '⚖️ Aprobado' : '⚖️ Rechazado'}
          </div>
          {(d.razon != null || d.feedback != null) && (
            <div className="mt-1" style={{ color: 'var(--text-secondary)' }}>{str(d.razon ?? d.feedback)}</div>
          )}
        </div>
      );
    }

    case 'error':
      return (
        <div className="p-3 rounded text-xs" style={{ background: 'rgba(255,71,87,0.08)', borderLeft: '3px solid var(--severity-critical)' }}>
          <div className="font-bold" style={{ color: 'var(--severity-critical)' }}>⚠️ Error en {str(d.origen)}</div>
          <div className="mt-1" style={{ color: 'var(--text-secondary)' }}>{str(d.mensaje)}</div>
        </div>
      );

    // Forward-compat: tipo desconocido → fallback genérico, nunca romper.
    default:
      return (
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
          <span className="font-mono">{evento.tipo}</span>
          {Object.keys(d).length > 0 && (
            <span className="ml-2 font-mono" style={{ color: 'var(--text-secondary)' }}>{JSON.stringify(d)}</span>
          )}
        </div>
      );
  }
}

function EventoItem({ evento }: { evento: CampaignEvent }) {
  return (
    <div className="flex gap-3">
      {/* Meta: hora + agente */}
      <div className="flex flex-col items-center pt-0.5 shrink-0" style={{ width: '70px' }}>
        <span className="text-base leading-none" title={evento.agente}>{iconoAgente(evento.agente)}</span>
        <span className="text-[10px] mt-1 font-mono" style={{ color: 'var(--text-muted)' }}>{hora(evento.timestamp)}</span>
        {evento.iteracion != null && (
          <span className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>it.{evento.iteracion}</span>
        )}
      </div>
      {/* Cuerpo */}
      <div className="flex-1 min-w-0">
        <CuerpoEvento evento={evento} />
      </div>
    </div>
  );
}

// ============================================================================
// Componente principal
// ============================================================================

export default function CampaignLogFeed({ eventos }: { eventos: CampaignEvent[] }) {
  const contenedorRef = useRef<HTMLDivElement>(null);
  // ¿El usuario está pegado al fondo? Solo entonces seguimos al último evento.
  // Si subió a leer, dejamos el scroll donde está y mostramos un botón para bajar.
  const [pegadoAbajo, setPegadoAbajo] = useState(true);

  // Auto-scroll solo dentro del contenedor (no afecta la página) y solo si el
  // usuario ya estaba al fondo. Así leer un fragmento arriba no te arrastra.
  useEffect(() => {
    if (!pegadoAbajo) return;
    const el = contenedorRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [eventos.length, pegadoAbajo]);

  function onScroll() {
    const el = contenedorRef.current;
    if (!el) return;
    const distanciaAlFondo = el.scrollHeight - el.scrollTop - el.clientHeight;
    setPegadoAbajo(distanciaAlFondo < 40); // margen de tolerancia en px
  }

  function bajarAlFondo() {
    const el = contenedorRef.current;
    if (el) el.scrollTop = el.scrollHeight;
    setPegadoAbajo(true);
  }

  return (
    <div className="p-6 rounded-xl border flex flex-col gap-4" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-bold" style={{ color: 'var(--text-primary)' }}>
          🛰️ Timeline en vivo
        </h3>
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{eventos.length} eventos</span>
      </div>

      <div className="relative">
        <div
          ref={contenedorRef}
          onScroll={onScroll}
          className="rounded-lg p-4 overflow-y-auto space-y-3"
          style={{ background: '#050914', border: '1px solid var(--border-primary)', maxHeight: '520px' }}
        >
          {eventos.length === 0 ? (
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
              Esperando actividad de la campaña...
            </div>
          ) : (
            eventos.map(ev => <EventoItem key={ev.id} evento={ev} />)
          )}
        </div>

        {/* Botón flotante: aparece solo si el usuario subió a leer */}
        {!pegadoAbajo && eventos.length > 0 && (
          <button
            onClick={bajarAlFondo}
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-full text-xs font-bold shadow-lg transition-all active:scale-95"
            style={{ background: 'var(--accent-cyan)', color: '#0a0e17' }}
          >
            ↓ Nuevos eventos
          </button>
        )}
      </div>
    </div>
  );
}
