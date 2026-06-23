// src/pages/TeamAssets.tsx
import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { teamService } from '@/services/teamService';
import type { Team, TeamMember, TeamStats } from '@/types/team';

import StatCard        from '@/components/team/StatCard';
import MemberCard      from '@/components/team/MemberCard';
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

  const [stats,          setStats]          = useState<TeamStats | null>(null);
  const [teams,          setTeams]          = useState<Team[]>([]);
  const [members,        setMembers]        = useState<TeamMember[]>([]);
  const [activeTab,      setActiveTab]      = useState<string>('');
  const [loading,        setLoading]        = useState(true);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showModal,      setShowModal]      = useState(false);
  
  const [showTeamModal,  setShowTeamModal]  = useState(false);
  const [newTeamName,    setNewTeamName]    = useState('');
  const [isCreatingTeam, setIsCreatingTeam] = useState(false);

  // ── Carga inicial: stats + equipos ─────────────────────────────────────────
  const fetchInitial = useCallback(async () => {
    setLoading(true);
    try {
      const [statsData, teamsData] = await Promise.all([
        teamService.getStats(),
        teamService.listTeams(),
      ]);
      setStats(statsData);
      setTeams(teamsData);
      
      if (teamsData.length > 0 && !activeTab) {
        setActiveTab(teamsData[0].id);
      }
    } catch (error) {
      console.error("Error al cargar stats o equipos:", error);
      setStats(null);
      setTeams([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // ── Carga miembros (AQUÍ CAZAREMOS EL ERROR INVISIBLE) ─────────────────────
  const fetchMembers = useCallback(async (teamId: string) => {
    if (!teamId) return;
    setLoadingMembers(true);
    try {
      const data = await teamService.listMembers(teamId);

      // 🕵️ AGREGA ESTA LÍNEA EXACTAMENTE AQUÍ:
      console.log("🕵️ PRUEBA DE FUEGO - Datos recibidos:", data);
      
      // Validamos que realmente sea un array
      if (Array.isArray(data)) {
        setMembers(data);
      } else if (data && typeof data === 'object' && 'members' in data) {
        // Por si el backend devuelve { members: [...] }
        setMembers((data as any).members as TeamMember[]);
      } else {
        setMembers([]);
      }
    } catch (error) {
      console.error("🔥 ERROR AL CARGAR MIEMBROS:", error); // <-- ESTO NOS DIRÁ EL PROBLEMA
      setMembers([]);
    } finally {
      setLoadingMembers(false);
    }
  }, []);

  useEffect(() => { fetchInitial(); }, [fetchInitial]);
  useEffect(() => { fetchMembers(activeTab); }, [activeTab, fetchMembers]);

  // ── Handlers de Miembros ───────────────────────────────────────────────────
  const handleDeleteMember = async (memberId: string) => {
    if (!window.confirm(t('pages.teamPage.error.confirmDelete', '¿Eliminar este miembro?'))) return;
    try {
      await teamService.deleteMember(memberId);
      fetchMembers(activeTab);
      fetchInitial();
    } catch (error) {
      alert(t('pages.teamPage.error.deleteFailed', 'Error al eliminar el miembro.'));
    }
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

  // ── Handlers de Equipos ────────────────────────────────────────────────────
  const handleCreateTeam = async () => {
    if (!newTeamName.trim()) return;
    setIsCreatingTeam(true);
    try {
      await teamService.createTeam({ name: newTeamName.trim() });
      setShowTeamModal(false);
      setNewTeamName('');
      await fetchInitial();
    } catch (error) {
      alert(t('pages.teamPage.error.createTeamFailed', 'Error al crear el equipo.'));
    } finally {
      setIsCreatingTeam(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!activeTab) return;
    const confirmDelete = window.confirm(t('pages.teamPage.error.confirmDeleteTeam', '⚠️ ¿Estás COMPLETAMENTE seguro de eliminar este equipo? Esto podría borrar a sus miembros.'));
    if (!confirmDelete) return;

    try {
      // Intentamos llamar al endpoint de borrar equipo
      await teamService.deleteTeam(activeTab);
      setActiveTab(''); // Reseteamos la pestaña
      await fetchInitial(); // Recargamos todo
    } catch (error) {
      console.error("Error al eliminar equipo:", error);
      alert(t('pages.teamPage.error.deleteTeamFailed', 'No se pudo eliminar el equipo. Asegúrate de que el backend soporte esta acción.'));
    }
  };

  const avgPerMember = stats && stats.total_members > 0
    ? (stats.active_tasks / stats.total_members).toFixed(1)
    : '0';

  if (loading && teams.length === 0) {
    return <LoadingSpinner message={t('pages.teamPage.loading', 'Cargando...')} />;
  }

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-text-primary flex items-center gap-2">
            <span>👥</span>
            <span>{t('pages.team.title', 'Team Assets')}</span>
          </h1>
          <p className="text-sm text-text-muted mt-1">
            {t('pages.teamPage.subtitle', 'Gestión de equipos y asignaciones')}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:flex-shrink-0">
          {teams.length > 0 && (
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border-secondary text-text-secondary hover:text-text-primary hover:border-border-primary transition-colors"
            >
              {t('pages.teamPage.btnAddMember', '+ Agregar Miembro')}
            </button>
          )}
          
          <button
            onClick={() => setShowTeamModal(true)}
            className="px-4 py-2 text-sm font-medium rounded-lg border border-accent-cyan text-accent-cyan hover:bg-accent-cyan/10 transition-colors"
          >
            {t('pages.teamPage.btnCreateTeam', '+ Crear Equipo')}
          </button>
          <button
            className="px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-accent-cyan to-accent-blue hover:opacity-90 active:opacity-80 transition-opacity shadow-md"
          >
            {t('pages.teamPage.btnSyncLdap', 'Sincronizar LDAP')}
          </button>
        </div>
      </div>

      {/* ── Stats ── */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard
            label={t('pages.teamPage.stats.totalMembers', 'Miembros Totales')}
            value={stats.total_members}
            sub={`${stats.total_teams} ${t('pages.teamPage.stats.teams', 'Equipos')}`}
          />
          <StatCard
            label={t('pages.teamPage.stats.activeTasks', 'Tareas Activas')}
            value={stats.active_tasks}
            sub={t('pages.teamPage.stats.avgPerMember', { val: avgPerMember })}
            valueColor="text-accent-cyan"
          />
          <StatCard
            label={t('pages.teamPage.stats.overloaded', 'Sobrecargados')}
            value={stats.overloaded_count}
            sub={t('pages.teamPage.stats.moreThan5', '> 5 tareas')}
            valueColor="text-severity-critical"
          />
          <StatCard
            label={t('pages.teamPage.stats.available', 'Disponibles')}
            value={stats.available_count}
            sub={t('pages.teamPage.stats.lessThan3', '< 3 tareas')}
            valueColor="text-severity-low"
          />
          <StatCard
            label={t('pages.teamPage.stats.avgCompletion', 'Tiempo Promedio')}
            value={`${stats.avg_completion_days}d`}
            sub={t('pages.teamPage.stats.perTask', 'por tarea')}
            valueColor="text-accent-cyan"
          />
        </div>
      )}

      {/* ── Cuerpo: Tabs + Miembros ── */}
      {teams.length === 0 ? (
        <div className="text-center py-20 bg-bg-secondary border border-border-primary rounded-xl">
          <span className="text-5xl block mb-3">🏗</span>
          <p className="text-text-primary font-semibold">
            {t('pages.teamPage.empty.noTeams', 'No hay equipos configurados')}
          </p>
          <p className="text-text-muted text-sm mt-1 mb-6">
            {t('pages.teamPage.empty.noTeamsHint', 'Crea un equipo primero para poder organizar a tus miembros.')}
          </p>
          <button
            onClick={() => setShowTeamModal(true)}
            className="px-6 py-2.5 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-accent-cyan to-accent-blue hover:opacity-90 transition-opacity shadow-md"
          >
            {t('pages.teamPage.btnCreateTeam', '+ Crear tu primer Equipo')}
          </button>
        </div>
      ) : (
        <>
          {/* Tabs de equipos y Botón Eliminar */}
          <div className="border-b border-border-primary flex justify-between items-end overflow-x-auto">
            <div className="flex gap-0 min-w-max">
              {teams.map(team => (
                <button
                  key={team.id}
                  onClick={() => handleTabChange(team.id)}
                  className={`
                    px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors
                    ${activeTab === team.id
                      ? 'text-accent-cyan border-accent-cyan'
                      : 'text-text-muted border-transparent hover:text-text-secondary'}
                  `}
                >
                  {team.icon && <span className="mr-1.5">{team.icon}</span>}
                  {team.name} ({team.member_count})
                </button>
              ))}
            </div>
            
            {/* Botón Peligroso para Eliminar Equipo Activo */}
            {activeTab && (
              <button
                onClick={handleDeleteTeam}
                className="mb-2 mr-2 px-3 py-1.5 text-xs font-semibold text-severity-critical border border-severity-critical/30 rounded hover:bg-severity-critical/10 transition-colors flex items-center gap-1"
                title="Borrar este equipo"
              >
                🗑️ Eliminar Equipo
              </button>
            )}
          </div>

          {/* Lista de miembros */}
          <div className="min-h-[200px]">
            {loadingMembers ? (
              <LoadingSpinner message={t('common.loading', 'Cargando...')} />
            ) : members.length === 0 ? (
              <div className="text-center py-16 bg-bg-secondary border border-border-primary rounded-xl mt-4">
                <span className="text-4xl block mb-3">👤</span>
                <p className="text-text-muted text-sm">
                  {t('pages.teamPage.empty.noMembers', 'Este equipo no tiene miembros aún.')}
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-4 px-5 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-accent-cyan to-accent-blue hover:opacity-90 transition-opacity"
                >
                  {t('pages.teamPage.empty.btnFirstMember', 'Agregar Miembro')}
                </button>
              </div>
            ) : (
              <div className="mt-4 grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                {members.map(member => (
                  <MemberCard
                    key={member.id}
                    member={member}
                    onEdit={() => {/* Modal edición */}}
                    onDelete={() => handleDeleteMember(member.id)}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal de agregar miembro */}
      {showModal && activeTab && (
        <AddMemberModal
          teamId={activeTab}
          onClose={() => setShowModal(false)}
          onSuccess={handleMemberAdded}
        />
      )}

      {/* Modal de crear equipo */}
      {showTeamModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-bg-primary border border-border-primary rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-xl font-bold mb-4 text-text-primary">
              {t('pages.teamPage.createTeamTitle', 'Crear Nuevo Equipo')}
            </h2>
            <input
              autoFocus
              className="w-full bg-bg-secondary border border-border-primary rounded-lg px-4 py-2.5 text-text-primary mb-6 focus:outline-none focus:border-accent-cyan transition-colors"
              placeholder={t('pages.teamPage.teamNamePlaceholder', 'Nombre del equipo (ej. Red Team)')}
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreateTeam()}
            />
            <div className="flex justify-end gap-3">
              <button 
                onClick={() => { setShowTeamModal(false); setNewTeamName(''); }} 
                className="px-4 py-2 text-sm font-medium text-text-muted hover:text-text-primary transition-colors"
                disabled={isCreatingTeam}
              >
                {t('common.cancel', 'Cancelar')}
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim() || isCreatingTeam}
                className="px-6 py-2 text-sm font-semibold rounded-lg bg-accent-cyan text-[#0a0e17] hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {isCreatingTeam && <div className="w-4 h-4 border-2 border-[#0a0e17] border-t-transparent rounded-full animate-spin" />}
                {t('common.create', 'Crear Equipo')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}