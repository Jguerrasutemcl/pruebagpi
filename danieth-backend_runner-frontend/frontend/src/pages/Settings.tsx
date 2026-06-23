import { useTranslation } from 'react-i18next';

export default function SettingsPage() {
  const { t } = useTranslation();

  // Datos simulados idénticos a los de Max para la tabla
  const teamMembers = [
    { initials: 'JS', name: 'John Smith', role: 'Sr. Security Engineer', color: 'bg-blue-500', portal: true, run: true, alerts: true, channel: '✉️ Email' },
    { initials: 'SJ', name: 'Sarah Johnson', role: 'Penetration Tester', color: 'bg-orange-500', portal: true, run: true, alerts: true, channel: '💬 WhatsApp' },
    { initials: 'MQ', name: 'Max Quinn', role: 'Security Analyst', color: 'bg-teal-500', portal: true, run: false, alerts: true, channel: '🎮 Discord' },
  ];

  return (
    <div className="min-h-full space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          {t('pages.settings.title')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {t('pages.settings.description')}
        </p>
      </div>

      {/* Sección: General Settings */}
      <div className="p-6 rounded-xl border border-[--border-primary] bg-[--bg-secondary]">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          ⚙️ {t('pages.settings.general.title')}
        </h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Tema */}
          <div>
            <label className="text-sm font-bold mb-3 block" style={{ color: 'var(--text-primary)' }}>
              {t('pages.settings.general.theme')}
            </label>
            <div className="flex gap-4">
               {/* Dark Mode (Activo) */}
               <div className="flex-1 border-2 border-[--accent-cyan] p-4 rounded-xl bg-[--bg-primary] text-center flex flex-col items-center justify-center gap-1 cursor-pointer">
                  <span className="text-2xl">🌙</span>
                  <span className="font-bold text-sm text-white">{t('pages.settings.general.dark')}</span>
                  <span className="text-xs text-[--accent-cyan]">{t('pages.settings.general.active')}</span>
               </div>
               {/* Light Mode (Inactivo) */}
               <div className="flex-1 border border-[--border-primary] p-4 rounded-xl bg-[--bg-tertiary] text-center flex flex-col items-center justify-center gap-1 opacity-50 cursor-not-allowed">
                  <span className="text-2xl">☀️</span>
                  <span className="font-bold text-sm text-white">{t('pages.settings.general.light')}</span>
                  <span className="text-xs text-[--text-muted]">{t('pages.settings.general.comingSoon')}</span>
               </div>
            </div>
          </div>
          
          {/* Idioma */}
          <div>
             <label className="text-sm font-bold mb-3 block" style={{ color: 'var(--text-primary)' }}>
               {t('pages.settings.general.language')}
             </label>
             <select className="w-full p-3 rounded-lg bg-[--bg-primary] border border-[--border-primary] text-sm text-white focus:outline-none focus:border-[--accent-cyan]">
                <option>GB English</option>
                <option>ES Español</option>
                <option>FR Français</option>
                <option>DE Deutsch</option>
             </select>
          </div>

          {/* AI Workers Slider */}
          <div>
             <label className="text-sm font-bold mb-3 block" style={{ color: 'var(--text-primary)' }}>
               {t('pages.settings.general.aiWorkers')}: 8
             </label>
             <div className="relative pt-1">
                <input type="range" min="1" max="16" defaultValue="8" className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-[--accent-cyan]" />
                <div className="flex justify-between text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                  <span>1</span>
                  <span>16</span>
                </div>
             </div>
             <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
               {t('pages.settings.general.aiWorkersHint')}
             </p>
          </div>
        </div>
      </div>

      {/* Sección: Team Member Permissions */}
      <div className="p-6 rounded-xl border border-[--border-primary] bg-[--bg-secondary] overflow-x-auto">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          🕵️‍♂️ {t('pages.settings.permissions.title')}
        </h2>
        
        <table className="w-full text-left whitespace-nowrap">
          <thead>
            <tr className="text-xs text-[--text-muted] border-b border-[--border-primary]">
              <th className="pb-4 font-medium">{t('pages.settings.permissions.table.member')}</th>
              <th className="pb-4 font-medium">{t('pages.settings.permissions.table.portalAccess')}</th>
              <th className="pb-4 font-medium">{t('pages.settings.permissions.table.runEngine')}</th>
              <th className="pb-4 font-medium">{t('pages.settings.permissions.table.receiveAlerts')}</th>
              <th className="pb-4 font-medium">{t('pages.settings.permissions.table.alertChannel')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[--border-primary]">
             {teamMembers.map((member, index) => (
               <tr key={index} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm ${member.color}`}>
                        {member.initials}
                      </div>
                      <div>
                        <div className="font-bold text-sm text-white">{member.name}</div>
                        <div className="text-xs text-[--text-muted]">{member.role}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4">
                    <input type="checkbox" defaultChecked={member.portal} className="w-4 h-4 accent-[--accent-cyan] bg-gray-700 border-gray-600 rounded" />
                  </td>
                  <td className="py-4">
                    <input type="checkbox" defaultChecked={member.run} className="w-4 h-4 accent-[--accent-cyan] bg-gray-700 border-gray-600 rounded" />
                  </td>
                  <td className="py-4">
                    <input type="checkbox" defaultChecked={member.alerts} className="w-4 h-4 accent-[--accent-cyan] bg-gray-700 border-gray-600 rounded" />
                  </td>
                  <td className="py-4">
                    <select className="bg-[--bg-primary] border border-[--border-primary] text-sm text-white rounded-lg px-3 py-1.5 focus:outline-none focus:border-[--accent-cyan]">
                      <option>{member.channel}</option>
                    </select>
                  </td>
               </tr>
             ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}