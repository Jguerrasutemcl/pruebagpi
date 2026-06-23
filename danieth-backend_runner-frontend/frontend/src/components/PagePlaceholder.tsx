/**
 * Componente de página placeholder.
 *
 * Se usa para las 7 secciones mientras no estén implementadas.
 * Cuando construyamos cada sección real, este componente se reemplaza por
 * el contenido específico (Dashboard real, Vulnerability Hub real, etc.).
 */
import { useTranslation } from 'react-i18next';

interface PagePlaceholderProps {
  /** Título de la página (ej: "Dashboard") */
  title: string;
  /** Descripción corta debajo del título */
  description: string;
  /** Emoji que representa la sección */
  icon: string;
}

export default function PagePlaceholder({ title, description, icon }: PagePlaceholderProps) {
  const { t } = useTranslation();

  return (
    <div className="max-w-5xl mx-auto">
      {/* Encabezado de la página */}
      <header className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold mb-2 flex items-center gap-3">
          <span aria-hidden="true">{icon}</span>
          <span>{title}</span>
        </h1>
        <p className="text-sm lg:text-base text-text-muted">{description}</p>
      </header>

      {/* Card placeholder "Próximamente" */}
      <div
        className="
          bg-bg-secondary border border-border-primary rounded-xl
          p-8 lg:p-12
          text-center
        "
      >
        <div className="text-5xl lg:text-6xl mb-4" aria-hidden="true">
          🚧
        </div>
        <h2 className="text-xl lg:text-2xl font-semibold mb-3 text-accent-cyan">
          {t('common.comingSoon')}
        </h2>
        <p className="text-sm lg:text-base text-text-secondary max-w-md mx-auto">
          {t('common.comingSoonDescription')}
        </p>
      </div>
    </div>
  );
}
