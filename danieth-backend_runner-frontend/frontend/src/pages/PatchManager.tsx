import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export default function PatchManagerPage() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('network');

  return (
    <div className="min-h-full space-y-6">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          🔧 {t('pages.patches.title', 'Patch Management')}
        </h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
          {t('pages.patches.description', 'Manage patches across infrastructure')}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b" style={{ borderColor: 'var(--border-primary)' }}>
        <button 
          className="px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2"
          style={{ 
            borderColor: activeTab === 'network' ? 'var(--accent-cyan)' : 'transparent',
            color: activeTab === 'network' ? 'var(--accent-cyan)' : 'var(--text-muted)'
          }}
          onClick={() => setActiveTab('network')}
        >
          🌍 {t('pages.patches.tabs.network', 'Network & Perimeter')}
          <span className="text-xs px-2 py-0.5 rounded-full font-bold" 
                style={{ 
                  background: activeTab === 'network' ? 'rgba(0, 212, 255, 0.1)' : 'var(--bg-tertiary)',
                  color: activeTab === 'network' ? 'var(--accent-cyan)' : 'var(--text-muted)'
                }}>10</span>
        </button>
        <button 
          className="px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2"
          style={{ 
            borderColor: activeTab === 'applications' ? 'var(--accent-cyan)' : 'transparent',
            color: activeTab === 'applications' ? 'var(--accent-cyan)' : 'var(--text-muted)'
          }}
          onClick={() => setActiveTab('applications')}
        >
          🌐 {t('pages.patches.tabs.applications', 'Application Security')}
          <span className="text-xs px-2 py-0.5 rounded-full font-bold" 
                style={{ 
                  background: activeTab === 'applications' ? 'rgba(0, 212, 255, 0.1)' : 'var(--bg-tertiary)',
                  color: activeTab === 'applications' ? 'var(--accent-cyan)' : 'var(--text-muted)'
                }}>17</span>
        </button>
        <button 
          className="px-6 py-3 text-sm font-medium border-b-2 transition-colors flex items-center gap-2"
          style={{ 
            borderColor: activeTab === 'servers' ? 'var(--accent-cyan)' : 'transparent',
            color: activeTab === 'servers' ? 'var(--accent-cyan)' : 'var(--text-muted)'
          }}
          onClick={() => setActiveTab('servers')}
        >
          🖥️ {t('pages.patches.tabs.servers', 'Servers & Containers')}
          <span className="text-xs px-2 py-0.5 rounded-full font-bold" 
                style={{ 
                  background: activeTab === 'servers' ? 'rgba(0, 212, 255, 0.1)' : 'var(--bg-tertiary)',
                  color: activeTab === 'servers' ? 'var(--accent-cyan)' : 'var(--text-muted)'
                }}>20</span>
        </button>
      </div>

      {/* Content Area */}
      {activeTab === 'network' && (
        <div className="rounded-xl border overflow-hidden animate-in fade-in duration-300" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
          
          {/* Toolbar */}
          <div className="px-5 py-4 border-b flex justify-between items-center" style={{ borderColor: 'var(--border-primary)' }}>
            <h2 className="text-sm font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              🌍 {t('pages.patches.tabs.network', 'Network & Perimeter Patches')}
            </h2>
            <button className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:brightness-110 active:scale-95"
                    style={{ background: 'var(--accent-cyan)', color: '#0a0e17' }}>
              {t('pages.patches.actions.autoAssign', 'Auto-Assign All')}
            </button>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wider text-left" style={{ color: 'var(--text-muted)', background: 'var(--bg-tertiary)' }}>
                  <th className="px-5 py-3 font-semibold">{t('pages.patches.table.cve', 'CVE')}</th>
                  <th className="px-5 py-3 font-semibold">{t('pages.patches.table.asset', 'Asset')}</th>
                  <th className="px-5 py-3 font-semibold">{t('pages.patches.table.version', 'Current → Target')}</th>
                  <th className="px-5 py-3 font-semibold">{t('pages.patches.table.severity', 'Severity')}</th>
                  <th className="px-5 py-3 font-semibold">{t('pages.patches.table.assigned', 'Assigned')}</th>
                  <th className="px-5 py-3 font-semibold">{t('pages.patches.table.action', 'Action')}</th>
                </tr>
              </thead>
              <tbody>
                <tr className="group transition-colors border-t" 
                    style={{ borderColor: 'var(--border-primary)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-tertiary)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td className="px-5 py-4"><span className="font-mono font-semibold text-xs" style={{ color: 'var(--accent-cyan)' }}>CVE-2024-3094</span></td>
                  <td className="px-5 py-4" style={{ color: 'var(--text-secondary)' }}>Cisco ASA Firewall</td>
                  <td className="px-5 py-4 font-mono text-xs" style={{ color: 'var(--text-muted)' }}>
                    9.14.2 <span style={{ color: 'var(--accent-cyan)' }}>→</span> 9.18.4
                  </td>
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold tracking-wide bg-[--severity-critical]/15 text-[--severity-critical] ring-1 ring-[--severity-critical]/30">CRITICAL</span>
                  </td>
                  <td className="px-5 py-4" style={{ color: 'var(--text-primary)' }}>Michael Torres</td>
                  <td className="px-5 py-4">
                    <button className="px-3 py-1.5 rounded-lg text-xs font-bold transition-colors border hover:bg-white/[0.05]"
                            style={{ borderColor: 'var(--border-primary)', color: 'var(--text-primary)', background: 'var(--bg-primary)' }}>
                      {t('pages.patches.actions.reassign', 'Reassign')}
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'applications' && (
         <div className="rounded-xl border overflow-hidden animate-in fade-in duration-300 p-8 text-center" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
           <div className="text-4xl mb-2 opacity-50">🌐</div>
           <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('pages.patches.emptyApp', 'Parches de aplicaciones simulados.')}</p>
         </div>
      )}

      {activeTab === 'servers' && (
         <div className="rounded-xl border overflow-hidden animate-in fade-in duration-300 p-8 text-center" style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}>
           <div className="text-4xl mb-2 opacity-50">🖥️</div>
           <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{t('pages.patches.emptyServers', 'Parches de servidores simulados.')}</p>
         </div>
      )}
    </div>
  );
}