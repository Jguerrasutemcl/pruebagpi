/**
 * Configuración de internacionalización (i18n).
 *
 * Esto cumple con el requisito de Alloxentric: ningún string hardcodeado en el código.
 * Para agregar un nuevo idioma:
 *   1. Crear src/locales/<código>.json con las mismas claves.
 *   2. Importarlo y agregarlo a `resources` abajo.
 */
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import esTranslations from '@/locales/es.json';
import enTranslations from '@/locales/en.json';
import deTranslations from '@/locales/de.json';
import frTranslations from '@/locales/fr.json';

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      es: { translation: esTranslations },
      en: { translation: enTranslations },
      de: { translation: deTranslations },
      fr: { translation: frTranslations },
    },
    fallbackLng: 'es',
    debug: false,
    interpolation: {
      escapeValue: false, // React ya escapa por default
    },
    detection: {
      // Orden en que se intenta detectar el idioma
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
