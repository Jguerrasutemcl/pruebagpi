import { useState, useEffect, useCallback } from 'react';
import type { ComponentProps } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { listarReportes, obtenerReporte } from '@/lib/orquestador';
import type { ReporteResumen, ReporteCompleto } from '@/lib/orquestador';

// ── Markdown renderer ────────────────────────────────────────────────────────

const mdComponents = {
  h1: (props: ComponentProps<'h1'>) => (
    <h1 className="text-2xl font-bold mt-8 mb-4 pb-3 border-b first:mt-0"
        style={{ color: 'var(--accent-cyan)', borderColor: 'rgba(0,212,255,0.2)' }} {...props} />
  ),
  h2: (props: ComponentProps<'h2'>) => (
    <h2 className="text-lg font-bold mt-7 mb-3 pb-2 border-b"
        style={{ color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }} {...props} />
  ),
  h3: (props: ComponentProps<'h3'>) => (
    <h3 className="text-base font-bold mt-5 mb-2"
        style={{ color: 'var(--severity-medium)' }} {...props} />
  ),
  h4: (props: ComponentProps<'h4'>) => (
    <h4 className="text-sm font-bold mt-4 mb-2"
        style={{ color: 'var(--text-primary)' }} {...props} />
  ),
  p: (props: ComponentProps<'p'>) => (
    <p className="text-sm mb-3 leading-relaxed"
       style={{ color: 'var(--text-secondary)' }} {...props} />
  ),
  ul: (props: ComponentProps<'ul'>) => (
    <ul className="list-disc pl-6 mb-3 space-y-1 text-sm"
        style={{ color: 'var(--text-secondary)' }} {...props} />
  ),
  ol: (props: ComponentProps<'ol'>) => (
    <ol className="list-decimal pl-6 mb-3 space-y-1 text-sm"
        style={{ color: 'var(--text-secondary)' }} {...props} />
  ),
  li: (props: ComponentProps<'li'>) => (
    <li className="leading-relaxed" {...props} />
  ),
  strong: (props: ComponentProps<'strong'>) => (
    <strong className="font-bold" style={{ color: 'var(--text-primary)' }} {...props} />
  ),
  em: (props: ComponentProps<'em'>) => (
    <em style={{ color: 'var(--severity-medium)' }} {...props} />
  ),
  code: (props: ComponentProps<'code'>) => (
    <code className="px-1.5 py-0.5 rounded font-mono text-xs"
          style={{ background: 'rgba(0,212,255,0.08)', color: 'var(--accent-cyan)' }} {...props} />
  ),
  pre: (props: ComponentProps<'pre'>) => (
    <pre className="p-4 rounded-lg my-3 overflow-x-auto text-xs font-mono leading-relaxed"
         style={{ background: '#020614', border: '1px solid var(--border-primary)', color: '#94a3b8' }} {...props} />
  ),
  blockquote: (props: ComponentProps<'blockquote'>) => (
    <blockquote className="border-l-4 pl-4 my-3 italic text-sm rounded-r-lg py-2"
                style={{ borderColor: 'var(--accent-cyan)', color: 'var(--text-muted)', background: 'rgba(0,212,255,0.03)' }} {...props} />
  ),
  table: (props: ComponentProps<'table'>) => (
    <div className="overflow-x-auto my-4 rounded-lg border" style={{ borderColor: 'var(--border-primary)' }}>
      <table className="w-full border-collapse text-sm" {...props} />
    </div>
  ),
  thead: (props: ComponentProps<'thead'>) => (
    <thead style={{ background: 'var(--bg-tertiary)' }} {...props} />
  ),
  th: (props: ComponentProps<'th'>) => (
    <th className="text-left px-4 py-2 font-semibold border-b text-xs uppercase"
        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }} {...props} />
  ),
  td: (props: ComponentProps<'td'>) => (
    <td className="px-4 py-2 border-b text-sm"
        style={{ borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }} {...props} />
  ),
  a: (props: ComponentProps<'a'>) => (
    <a className="underline hover:opacity-80"
       style={{ color: 'var(--accent-cyan)' }}
       target="_blank" rel="noreferrer" {...props} />
  ),
  hr: () => <hr className="my-6" style={{ borderColor: 'var(--border-primary)' }} />,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatFecha(fecha: string): string {
  try {
    const d = new Date(fecha.replace(' ', 'T'));
    if (Number.isNaN(d.getTime())) return fecha;
    return d.toLocaleString('es-ES', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return fecha;
  }
}

// ── Skeleton card ────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border p-5 space-y-3 animate-pulse"
         style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
      <div className="h-5 rounded" style={{ background: 'var(--bg-tertiary)', width: '65%' }} />
      <div className="h-3 rounded" style={{ background: 'var(--bg-tertiary)', width: '45%' }} />
      <div className="h-3 rounded mt-4" style={{ background: 'var(--bg-tertiary)', width: '35%' }} />
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const [reportes, setReportes] = useState<ReporteResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [seleccionado, setSeleccionado] = useState<ReporteCompleto | null>(null);
  const [cargandoDetalle, setCargandoDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const cargar = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setReportes(await listarReportes());
    } catch {
      setError('No se pudieron cargar los reportes. Verificá que el orquestador esté activo.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  const abrirReporte = async (r: ReporteResumen) => {
    if (seleccionado?.id === r.id) {
      setSeleccionado(null);
      return;
    }
    setSeleccionado(null);
    setErrorDetalle(null);
    setCargandoDetalle(true);
    try {
      setSeleccionado(await obtenerReporte(r.id));
    } catch {
      setErrorDetalle('No se pudo cargar el contenido del reporte.');
    } finally {
      setCargandoDetalle(false);
    }
  };

  const copiar = async () => {
    if (!seleccionado?.contenido) return;
    await navigator.clipboard.writeText(seleccionado.contenido);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="min-h-full space-y-6 pb-10">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            📋 Reportes
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
            Reportes ejecutivos generados al finalizar cada campaña de pentesting.
          </p>
        </div>
        <button
          onClick={cargar}
          disabled={loading}
          className="flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium border transition-opacity disabled:opacity-40"
          style={{
            background: 'var(--bg-secondary)',
            borderColor: 'var(--border-primary)',
            color: 'var(--text-secondary)',
          }}>
          ⟳ {loading ? 'Cargando…' : 'Actualizar'}
        </button>
      </div>

      {/* Error al listar */}
      {error && (
        <div className="rounded-xl p-4 text-sm"
             style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)', color: 'var(--severity-critical)' }}>
          ⚠ {error}
        </div>
      )}

      {/* Skeletons */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <SkeletonCard /><SkeletonCard /><SkeletonCard />
        </div>
      )}

      {/* Estado vacío */}
      {!loading && !error && reportes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 rounded-xl border"
             style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          <div className="text-5xl mb-4 opacity-20">📋</div>
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            Todavía no hay reportes
          </p>
          <p className="text-xs mt-2 text-center max-w-xs" style={{ color: 'var(--text-muted)' }}>
            Los reportes aparecen aquí cuando el orquestador completa una campaña en AI Pentesting.
          </p>
        </div>
      )}

      {/* Cards */}
      {!loading && reportes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reportes.map(r => {
            const activo = seleccionado?.id === r.id;
            return (
              <button
                key={r.id}
                onClick={() => abrirReporte(r)}
                disabled={cargandoDetalle && !activo}
                className="text-left rounded-xl border p-5 flex flex-col gap-2 transition-all disabled:opacity-50"
                style={{
                  background: activo ? 'rgba(0,212,255,0.04)' : 'var(--bg-secondary)',
                  borderColor: activo ? 'var(--accent-cyan)' : 'var(--border-primary)',
                  boxShadow: activo ? '0 0 0 1px rgba(0,212,255,0.15)' : 'none',
                }}>

                {/* Target */}
                <div className="font-mono font-bold text-base truncate"
                     style={{ color: 'var(--accent-cyan)' }}>
                  {r.target}
                </div>

                {/* Fecha + badge iteraciones */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {formatFecha(r.fecha)}
                  </span>
                  {r.iteraciones !== null && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                          style={{ background: 'rgba(0,212,255,0.1)', color: 'var(--accent-cyan)' }}>
                      {r.iteraciones} iter.
                    </span>
                  )}
                </div>

                {/* CTA */}
                <div className="mt-2 text-xs font-semibold"
                     style={{ color: activo ? 'var(--text-muted)' : 'var(--accent-cyan)' }}>
                  {activo ? '▲ Cerrar reporte' : '📄 Ver reporte →'}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Indicador carga detalle */}
      {cargandoDetalle && (
        <div className="text-sm text-center py-4" style={{ color: 'var(--text-muted)' }}>
          ⟳ Cargando reporte…
        </div>
      )}

      {/* Error detalle */}
      {errorDetalle && (
        <div className="rounded-lg p-3 text-sm"
             style={{ background: 'rgba(255,59,48,0.06)', border: '1px solid rgba(255,59,48,0.2)', color: 'var(--severity-critical)' }}>
          ⚠ {errorDetalle}
        </div>
      )}

      {/* Lector de reporte */}
      {seleccionado && (
        <div className="rounded-xl border overflow-hidden"
             style={{ background: 'var(--bg-secondary)', borderColor: 'var(--accent-cyan)', boxShadow: '0 0 0 1px rgba(0,212,255,0.08)' }}>

          {/* Cabecera del lector */}
          <div className="px-6 py-4 flex items-center justify-between gap-4 border-b"
               style={{ background: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)' }}>
            <div className="min-w-0">
              <div className="font-mono font-bold text-lg truncate"
                   style={{ color: 'var(--accent-cyan)' }}>
                {seleccionado.target}
              </div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                {formatFecha(seleccionado.fecha)}
                {seleccionado.iteraciones !== null && ` · ${seleccionado.iteraciones} iteraciones`}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={copiar}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border transition-all"
                style={{
                  borderColor: copiado ? 'var(--severity-low)' : 'var(--border-primary)',
                  color: copiado ? 'var(--severity-low)' : 'var(--text-muted)',
                  background: 'transparent',
                }}>
                {copiado ? '✓ Copiado' : '⎘ Copiar MD'}
              </button>
              <button
                onClick={() => setSeleccionado(null)}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border"
                style={{ borderColor: 'var(--border-primary)', color: 'var(--text-muted)', background: 'transparent' }}>
                ✕ Cerrar
              </button>
            </div>
          </div>

          {/* Contenido markdown */}
          <div className="overflow-y-auto px-8 py-6" style={{ maxHeight: '75vh' }}>
            {seleccionado.contenido ? (
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={mdComponents}>
                {seleccionado.contenido}
              </ReactMarkdown>
            ) : (
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                El reporte no tiene contenido.
              </p>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
