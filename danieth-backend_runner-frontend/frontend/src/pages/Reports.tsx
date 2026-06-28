import { useEffect, useState } from 'react';
import type { ComponentProps } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { listarReportes, obtenerReporte, ReporteResumen, ReporteCompleto } from '../lib/orquestador';

// El orquestador (LLM) suele envolver todo el reporte en un fence ```markdown ... ```.
// Si el contenido entero es un único bloque de código, lo desenvolvemos para que
// react-markdown parsee el markdown real en vez de mostrarlo crudo.
function limpiarMarkdown(contenido: string): string {
  const texto = contenido.trim();
  const fence = texto.match(/^```[a-zA-Z]*\n([\s\S]*?)\n```$/);
  return fence ? fence[1] : contenido;
}

// Mapeo de elementos markdown a estilos con las variables CSS del tema
// (Tailwind resetea h1/h2/tablas y el proyecto no tiene el plugin Typography).
const markdownComponents = {
  h1: (props: ComponentProps<'h1'>) => (
    <h1 className="text-2xl font-bold mt-6 mb-3 pb-2 border-b" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }} {...props} />
  ),
  h2: (props: ComponentProps<'h2'>) => (
    <h2 className="text-xl font-bold mt-6 mb-3" style={{ color: 'var(--text-primary)' }} {...props} />
  ),
  h3: (props: ComponentProps<'h3'>) => (
    <h3 className="text-lg font-bold mt-4 mb-2" style={{ color: 'var(--accent-cyan)' }} {...props} />
  ),
  p: (props: ComponentProps<'p'>) => (
    <p className="my-3" style={{ color: 'var(--text-secondary)' }} {...props} />
  ),
  ul: (props: ComponentProps<'ul'>) => (
    <ul className="list-disc pl-6 my-3 space-y-1" style={{ color: 'var(--text-secondary)' }} {...props} />
  ),
  ol: (props: ComponentProps<'ol'>) => (
    <ol className="list-decimal pl-6 my-3 space-y-1" style={{ color: 'var(--text-secondary)' }} {...props} />
  ),
  li: (props: ComponentProps<'li'>) => <li className="leading-relaxed" {...props} />,
  a: (props: ComponentProps<'a'>) => (
    <a className="underline hover:opacity-80" style={{ color: 'var(--accent-cyan)' }} target="_blank" rel="noreferrer" {...props} />
  ),
  strong: (props: ComponentProps<'strong'>) => (
    <strong className="font-bold" style={{ color: 'var(--text-primary)' }} {...props} />
  ),
  blockquote: (props: ComponentProps<'blockquote'>) => (
    <blockquote className="border-l-4 pl-4 my-3 italic" style={{ borderColor: 'var(--accent-cyan)', color: 'var(--text-muted)' }} {...props} />
  ),
  code: (props: ComponentProps<'code'>) => (
    <code className="px-1.5 py-0.5 rounded text-sm font-mono" style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-cyan)' }} {...props} />
  ),
  pre: (props: ComponentProps<'pre'>) => (
    <pre className="p-4 rounded-lg my-3 overflow-x-auto text-sm font-mono" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-primary)' }} {...props} />
  ),
  table: (props: ComponentProps<'table'>) => (
    <div className="overflow-x-auto my-4">
      <table className="w-full text-sm border-collapse" style={{ color: 'var(--text-secondary)' }} {...props} />
    </div>
  ),
  th: (props: ComponentProps<'th'>) => (
    <th className="text-left px-3 py-2 font-bold border" style={{ color: 'var(--text-primary)', borderColor: 'var(--border-primary)', background: 'var(--bg-tertiary)' }} {...props} />
  ),
  td: (props: ComponentProps<'td'>) => (
    <td className="px-3 py-2 border" style={{ borderColor: 'var(--border-primary)' }} {...props} />
  ),
  hr: (props: ComponentProps<'hr'>) => (
    <hr className="my-4" style={{ borderColor: 'var(--border-primary)' }} {...props} />
  ),
};

export default function ReportsPage() {
  const { t } = useTranslation();

  // Estado de lista
  const [reportes, setReportes] = useState<ReporteResumen[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado de detalle
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteCompleto | null>(null);
  const [loadingDetalle, setLoadingDetalle] = useState(false);
  const [errorDetalle, setErrorDetalle] = useState<string | null>(null);

  // Cargar lista de reportes al montar
  useEffect(() => {
    cargarReportes();
  }, []);

  const cargarReportes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listarReportes();
      setReportes(data);
    } catch (err) {
      setError(t('pages.reports.error'));
      console.error('Error al cargar reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  const cargarReporte = async (id: string) => {
    setLoadingDetalle(true);
    setErrorDetalle(null);
    try {
      const data = await obtenerReporte(id);
      setReporteSeleccionado(data);
    } catch (err) {
      setErrorDetalle(t('pages.reports.reportError'));
      console.error('Error al cargar reporte:', err);
    } finally {
      setLoadingDetalle(false);
    }
  };

  const volverALista = () => {
    setReporteSeleccionado(null);
    setErrorDetalle(null);
  };

  // VISTA DE DETALLE
  if (reporteSeleccionado) {
    return (
      <div className="min-h-full space-y-6">
        {/* Header con botón volver */}
        <div className="flex items-center gap-4">
          <button
            onClick={volverALista}
            className="px-4 py-2 rounded-lg text-sm font-bold bg-[--bg-tertiary] text-[--text-primary] hover:opacity-80 transition-opacity"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
          >
            ← {t('pages.reports.backButton')}
          </button>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
            {t('pages.reports.reportDetail')}
          </h1>
        </div>

        {/* Información del reporte */}
        <div className="p-6 rounded-xl border border-[--border-primary] bg-[--bg-secondary]" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                {t('pages.reports.dateLabel')}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                {reporteSeleccionado.fecha}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                {t('pages.reports.targetLabel')}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                {reporteSeleccionado.target}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                {t('pages.reports.iterationsLabel')}
              </p>
              <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                {reporteSeleccionado.iteraciones ?? '—'}
              </p>
            </div>
            <div>
              <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                {t('pages.reports.missionLabel')}
              </p>
              <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-primary)' }}>
                {reporteSeleccionado.mision}
              </p>
            </div>
          </div>
        </div>

        {/* Contenido del reporte o error */}
        {loadingDetalle ? (
          <div className="flex justify-center items-center py-16">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[--accent-cyan] border-t-transparent mx-auto mb-4" style={{ borderColor: 'var(--accent-cyan)', borderTopColor: 'transparent' }}></div>
              <p style={{ color: 'var(--text-secondary)' }}>{t('common.loading')}</p>
            </div>
          </div>
        ) : errorDetalle ? (
          <div className="p-6 rounded-xl border border-[--severity-critical] bg-[--bg-secondary]" style={{ borderColor: 'var(--severity-critical)', backgroundColor: 'var(--bg-secondary)' }}>
            <p style={{ color: 'var(--severity-critical)' }} className="font-bold">
              {errorDetalle}
            </p>
            <button
              onClick={volverALista}
              className="mt-4 px-4 py-2 rounded-lg text-sm font-bold bg-[--accent-cyan] text-black hover:opacity-90"
              style={{ backgroundColor: 'var(--accent-cyan)' }}
            >
              {t('pages.reports.backButton')}
            </button>
          </div>
        ) : (
          <div className="p-6 rounded-xl border border-[--border-primary] bg-[--bg-secondary]" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
            <div style={{ color: 'var(--text-secondary)', lineHeight: '1.7' }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                {limpiarMarkdown(reporteSeleccionado.contenido)}
              </ReactMarkdown>
            </div>
          </div>
        )}
      </div>
    );
  }

  // VISTA DE LISTA
  return (
    <div className="min-h-full space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          📈 {t('pages.reports.title')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {t('pages.reports.description')}
        </p>
      </div>

      {/* Estado: Cargando */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-2 border-[--accent-cyan] border-t-transparent mx-auto mb-4" style={{ borderColor: 'var(--accent-cyan)', borderTopColor: 'transparent' }}></div>
            <p style={{ color: 'var(--text-secondary)' }}>{t('pages.reports.loading')}</p>
          </div>
        </div>
      ) : error ? (
        // Estado: Error
        <div className="p-8 rounded-xl border border-[--severity-critical] bg-[--bg-secondary]" style={{ borderColor: 'var(--severity-critical)', backgroundColor: 'var(--bg-secondary)' }}>
          <p style={{ color: 'var(--severity-critical)' }} className="font-bold text-lg">
            {error}
          </p>
          <button
            onClick={cargarReportes}
            className="mt-6 px-6 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-[--accent-cyan] to-[--accent-blue] text-black hover:opacity-90 active:scale-95 transition-all"
            style={{
              backgroundImage: 'linear-gradient(to right, var(--accent-cyan), var(--accent-blue))',
              color: 'black',
            }}
          >
            {t('common.retry')}
          </button>
        </div>
      ) : reportes.length === 0 ? (
        // Estado: Vacío
        <div className="p-8 rounded-xl border border-[--border-primary] bg-[--bg-secondary] text-center" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-secondary)' }}>
          <div className="text-4xl mb-4">📋</div>
          <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--text-primary)' }}>
            {t('pages.reports.empty')}
          </h3>
          <p style={{ color: 'var(--text-muted)' }} className="text-sm">
            {t('pages.reports.description')}
          </p>
        </div>
      ) : (
        // Estado: Normal - Grid de reportes
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {reportes.map((reporte) => (
            <div
              key={reporte.id}
              className="p-6 rounded-xl border border-[--border-primary] bg-[--bg-secondary] flex flex-col justify-between hover:border-[--accent-cyan]/50 transition-colors"
              style={{
                borderColor: 'var(--border-primary)',
                backgroundColor: 'var(--bg-secondary)',
              }}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                      {t('pages.reports.dateLabel')}
                    </p>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-primary)' }}>
                      {reporte.fecha}
                    </p>
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                      {t('pages.reports.iterationsLabel')}
                    </p>
                    <p className="text-sm mt-1 font-bold" style={{ color: 'var(--accent-cyan)' }}>
                      {reporte.iteraciones ?? '—'}
                    </p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                    {t('pages.reports.targetLabel')}
                  </p>
                  <p className="text-sm mt-1 truncate" style={{ color: 'var(--text-primary)' }}>
                    {reporte.target}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold uppercase" style={{ color: 'var(--text-muted)' }}>
                    {t('pages.reports.missionLabel')}
                  </p>
                  <p className="text-sm mt-1 line-clamp-2" style={{ color: 'var(--text-secondary)' }}>
                    {reporte.mision}
                  </p>
                </div>
              </div>

              <button
                onClick={() => cargarReporte(reporte.id)}
                className="mt-6 w-full px-4 py-2 rounded-lg text-sm font-bold bg-gradient-to-r from-[--accent-cyan] to-[--accent-blue] text-black hover:opacity-90 active:scale-95 transition-all"
                style={{
                  backgroundImage: 'linear-gradient(to right, var(--accent-cyan), var(--accent-blue))',
                  color: 'black',
                }}
              >
                {t('pages.reports.viewReport')}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
