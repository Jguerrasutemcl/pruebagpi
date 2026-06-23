import { useTranslation } from 'react-i18next';
import { useTheme } from '@/contexts/ThemeContext';
import i18n from '@/lib/i18n';
import { useState } from 'react';

export default function SettingsPage() {
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();
  const [currentLang, setCurrentLang] = useState(i18n.language ?? 'es');

  const handleLangChange = (lang: string) => {
    setCurrentLang(lang);
    i18n.changeLanguage(lang);
  };

  return (
    <div className="min-h-full space-y-6 max-w-xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          ⚙️ {t('pages.settings.title')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {t('pages.settings.description')}
        </p>
      </div>

      <div className="p-6 rounded-xl border space-y-8" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>

        {/* Tema */}
        <div>
          <label className="text-sm font-bold mb-3 block" style={{ color: 'var(--text-primary)' }}>
            {t('pages.settings.general.theme')}
          </label>
          <div className="flex gap-4">
            <div
              onClick={() => setTheme('dark')}
              className={`flex-1 border-2 p-4 rounded-xl text-center flex flex-col items-center gap-1 cursor-pointer transition-all
                ${theme === 'dark' ? 'border-[--accent-cyan]' : 'border-[--border-primary] opacity-50'}`}
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <span className="text-2xl">🌙</span>
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {t('pages.settings.general.dark')}
              </span>
              {theme === 'dark' && (
                <span className="text-xs" style={{ color: 'var(--accent-cyan)' }}>
                  {t('pages.settings.general.active')}
                </span>
              )}
            </div>

            <div
              onClick={() => setTheme('light')}
              className={`flex-1 border-2 p-4 rounded-xl text-center flex flex-col items-center gap-1 cursor-pointer transition-all
                ${theme === 'light' ? 'border-[--accent-cyan]' : 'border-[--border-primary] opacity-50'}`}
              style={{ background: 'var(--bg-tertiary)' }}
            >
              <span className="text-2xl">☀️</span>
              <span className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                {t('pages.settings.general.light')}
              </span>
              {theme === 'light' && (
                <span className="text-xs" style={{ color: 'var(--accent-cyan)' }}>
                  {t('pages.settings.general.active')}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Idioma */}
        <div>
          <label className="text-sm font-bold mb-3 block" style={{ color: 'var(--text-primary)' }}>
            {t('pages.settings.general.language')}
          </label>
          <select
            value={currentLang}
            onChange={(e) => handleLangChange(e.target.value)}
            className="w-full p-3 rounded-lg border text-sm outline-none"
            style={{
              background: 'var(--bg-tertiary)',
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)',
            }}
          >
            <option value="es">🇪🇸 Español</option>
            <option value="en">🇬🇧 English</option>
            <option value="fr">🇫🇷 Français</option>
            <option value="de">🇩🇪 Deutsch</option>
          </select>
        </div>

      </div>
    </div>
  );
}
