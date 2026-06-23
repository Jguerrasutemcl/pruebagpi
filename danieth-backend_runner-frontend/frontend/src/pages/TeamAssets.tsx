import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

// Seguimos usando los componentes modulares de los orquestadores
import StatCard      from '@/components/team/StatCard';
import MemberCard    from '@/components/team/MemberCard';
import AddMemberModal  from '@/components/team/AddMemberModal';

// ── Spinner centralizado ───────────────────────────────────────────────────────
function LoadingSpinner({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────────
export default function TeamAssetsPage() {
  const { t } = useTranslation();

  const [stats,      setStats]      = useState<any>(null);
  const [teams,      setTeams]      = useState<any[]>([]);
  const [members,    setMembers]    = useState<any[]>([]);
  const [activeTab,  setActiveTab]  = useState<string>('');
  const [loading,    setLoading]    = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showModal,  setShowModal]  = useState(false);

  // ── Carga inicial: Inyectamos Mock Data en lugar del Backend ───────────────
  const fetchInitial = useCallback(async () => {
    setLoading(true);
    // Simulamos medio segundo de retraso para que se vea el spinner de carga
    setTimeout(() => {
      setStats({
        total_members: 24,
        total_teams: 3,
        active_tasks: 47,
        overloaded_count: 5,
        available_count: 12,
        avg_completion_days: 2.3
      });
      setTeams([
        { id: 't1', name: 'Security Engineering', icon: '🛡️', member_count: 10 },
        { id: 't2', name: 'Infrastructure', icon: '🖥️', member_count: 8 },
        { id: 't3', name: 'Application Team', icon: '💻', member_count: 6 }
      ]);
      setActiveTab('t1');
      setLoading(false);
    }, 500);
  }, []);

  // ── Carga miembros: Inyectamos Mock Data cuando cambias de pestaña ─────────
  const fetchMembers = useCallback(async (teamId: string) => {
    if (!teamId) return;
    setLoadingMembers(true);
    setTimeout(() => {
      // Datos combinados simulando el diseño completo
      setMembers([
        { 
          id: "USR-01", 
          name: "John Smith", 
          role: "Sr. Security Engineer", 
          tasksAssigned: 7, 
          completed: 12, 
          avgTime: "1.8 days", 
          status: "Online" 
        },
        { 
          id: "USR-02", 
          name: "Sarah Johnson", 
          role: "Security Analyst", 
          tasksAssigned: 5, 
          completed: 15, 
          avgTime: "2.1 days", 
          status: "Online" 
        }
      ]);
      setLoadingMembers(false);
    }, 400);
  }, []);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);
  useEffect(() => { fetchMembers(activeTab); }, [activeTab, fetchMembers]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDelete = async (memberId: string) => {
    if (!window.confirm(t('pages.teamPage.error.confirmDelete'))) return;
    alert("Usuario eliminado en modo demostración.");
  };

  const handleMemberAdded = () => {
    fetchMembers(activeTab);
    fetchInitial();
  };

  const handleTabChange = (teamId: string) => {
    if (teamId !== activeTab) {
      setActiveTab(teamId);
    }
  };

  const avgPerMember = stats && stats.total_members > 0
    ? (stats.active_tasks / stats.total_members).toFixed(1)
    : '0';

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) {
    return <LoadingSpinner message={t('pages.teamPage.loading')} />;
  }

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary flex items-center gap-2">
            <span>👥</span>
            <span>{t('pages.team.title', 'Gestión de Equipos y Activos')}</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {t('pages.teamPage.subtitle', 'Manage security teams, workload distribution, and app access')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-border-secondary text-text-secondary hover:text-text-primary hover:border-border-primary transition-colors">
            {t('pages.teamPage.btnAddMember', '+ Add Member')}
          </button>
          <button className="px-4 py-2 text-sm font-medium rounded-lg border border-border-secondary text-text-secondary hover:text-text-primary hover:border-border-primary transition-colors">
            {t('pages.teamPage.btnAnalytics', 'Team Analytics')}
          </button>
          <button className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-accent-cyan to-accent-blue hover:opacity-90 active:opacity-80 transition-opacity shadow-md">
            {t('pages.teamPage.btnSyncLdap', 'Sync from LDAP')}
          </button>
        </div>
      </div>

      {/* ── Stats (5 tarjetas importadas de los orquestadores) ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label={t('pages.teamPage.stats.totalMembers', 'Total Members')} value={stats.total_members} sub={`${stats.total_teams} ${t('pages.teamPage.stats.teams', 'teams')}`} />
          <StatCard label={t('pages.teamPage.stats.activeTasks', 'Active Tasks')} value={stats.active_tasks} sub={t('pages.teamPage.stats.avgPerMember', { val: avgPerMember })} valueColor="text-accent-cyan" />
          <StatCard label={t('pages.teamPage.stats.overloaded', 'Overloaded')} value={stats.overloaded_count} sub={t('pages.teamPage.stats.moreThan5', '>5 tasks each')} valueColor="text-severity-critical" />
          <StatCard label={t('pages.teamPage.stats.available', 'Available')} value={stats.available_count} sub={t('pages.teamPage.stats.lessThan3', '<3 tasks each')} valueColor="text-severity-low" />
          <StatCard label={t('pages.teamPage.stats.avgCompletion', 'Avg Completion')} value={`${stats.avg_completion_days}d`} sub={t('pages.teamPage.stats.perTask', 'Per task')} valueColor="text-accent-cyan" />
        </div>
      )}

      {/* ── Cuerpo: Tabs + Miembros ── */}
      {teams.length > 0 && (
        <>
          {/* Tabs de equipos */}
          <div className="border-b border-border-primary overflow-x-auto">
            <div className="flex gap-0 min-w-max">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => handleTabChange(team.id)}
                  className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                    ${activeTab === team.id ? 'text-accent-cyan border-accent-cyan' : 'text-text-muted border-transparent hover:text-text-secondary'}
                  `}
                >
                  {team.icon && <span className="mr-1.5">{team.icon}</span>}
                  {team.name}
                </button>
              ))}
            </div>
          </div>

          {/* Lista de miembros importada */}
          <div className="min-h-[200px]">
            {loadingMembers ? (
              <LoadingSpinner message={t('common.loading', 'Loading...')} />
            ) : (
              members.map(member => (
                <MemberCard
                  key={member.id}
                  member={member}
                  onEdit={() => {}}
                  onDelete={handleDelete}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* ── Modal de nuevo miembro ── */}
      {showModal && activeTab && (
        <AddMemberModal
          teamId={activeTab}
          onClose={() => setShowModal(false)}
          onSuccess={handleMemberAdded}
        />
      )}
    </div>
  );
}