// src/components/team/AddMemberModal.tsx
//
// Agrega un usuario existente de la empresa a un equipo.
// Carga la lista de usuarios desde GET /api/v1/users y permite
// al Admin seleccionar uno; luego llama a POST /teams/{teamId}/members
// con los datos reales del usuario (firebase_uid, name, email, role).
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { teamService } from '@/services/teamService';
import { apiClient } from '@/lib/api';
import type { TeamMemberCreate } from '@/types/team';

interface AddMemberModalProps {
  teamId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface CompanyUser {
  user_id: string;
  name: string | null;
  email: string | null;
  role: string;
}

export default function AddMemberModal({ teamId, onClose, onSuccess }: AddMemberModalProps) {
  const { t } = useTranslation();

  const [users, setUsers]               = useState<CompanyUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [selectedId, setSelectedId]     = useState('');
  const [isTeamLead, setIsTeamLead]     = useState(false);
  const [loading, setLoading]           = useState(false);
  const [error, setError]               = useState('');

  // Cargar usuarios de la empresa al abrir el modal
  useEffect(() => {
    apiClient
      .get<CompanyUser[]>('/api/v1/users')
      .then(r => setUsers(r.data))
      .catch(() =>
        setError(t('pages.teamPage.modal.errorLoadingUsers', 'No se pudieron cargar los usuarios.'))
      )
      .finally(() => setLoadingUsers(false));
  }, [t]);

  const selectedUser = users.find(u => u.user_id === selectedId) ?? null;

  const handleSubmit = async () => {
    if (!selectedUser) {
      setError(t('pages.teamPage.modal.errorSelectUser', 'Selecciona un usuario.'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: TeamMemberCreate = {
        name:         selectedUser.name  ?? '',
        email:        selectedUser.email ?? '',
        role:         selectedUser.role,
        team_id:      teamId,
        is_team_lead: isTeamLead,
        firebase_uid: selectedUser.user_id,
      };
      await teamService.createMember(teamId, payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(detail ?? t('pages.teamPage.modal.errorApi', 'Ocurrió un error en el servidor'));
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Overlay para cerrar */}
      <div className="absolute inset-0" onClick={!loading ? onClose : undefined} />

      {/* Card del modal */}
      <div className="relative z-10 w-full max-w-md bg-bg-secondary border border-border-primary rounded-2xl shadow-2xl p-6">

        <h2 id="modal-title" className="text-base font-bold text-text-primary mb-5">
          {t('pages.teamPage.modal.addTitle', 'Agregar Miembro al Equipo')}
        </h2>

        <div className="space-y-4">

          {/* Selector de usuario */}
          <div>
            <label htmlFor="user-select" className="block text-xs font-medium text-text-muted mb-1.5">
              {t('pages.teamPage.modal.fieldUser', 'Usuario de la empresa')}
            </label>

            {loadingUsers ? (
              <div className="flex items-center gap-2 px-3 py-2.5 bg-bg-tertiary border border-border-secondary rounded-lg">
                <div className="w-4 h-4 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-text-muted">Cargando usuarios...</span>
              </div>
            ) : users.length === 0 ? (
              <p className="text-xs text-text-muted px-3 py-2.5 bg-bg-tertiary border border-border-secondary rounded-lg">
                No hay usuarios disponibles. Crea uno primero en la pestaña{' '}
                <strong className="text-text-secondary">Usuarios</strong>.
              </p>
            ) : (
              <div className="relative">
                <select
                  id="user-select"
                  value={selectedId}
                  onChange={e => { setSelectedId(e.target.value); setError(''); }}
                  disabled={loading}
                  className={`
                    w-full bg-bg-tertiary border border-border-secondary rounded-lg
                    px-3 py-2.5 text-sm appearance-none
                    focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent
                    disabled:opacity-50 disabled:cursor-not-allowed transition-colors
                    ${selectedId === '' ? 'text-text-muted' : 'text-text-primary'}
                  `}
                >
                  <option value="" disabled>
                    {t('pages.teamPage.modal.fieldUserPlaceholder', 'Selecciona un usuario...')}
                  </option>
                  {users.map(u => (
                    <option key={u.user_id} value={u.user_id}>
                      {u.name ?? u.email} — {u.role}
                    </option>
                  ))}
                </select>

                {/* Flecha decorativa */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-text-muted">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            )}
          </div>

          {/* Vista previa del usuario seleccionado */}
          {selectedUser && (
            <div className="px-3 py-2.5 bg-bg-tertiary border border-border-secondary rounded-lg space-y-0.5">
              <p className="text-xs text-text-muted">
                Email:{' '}
                <span className="text-text-secondary">{selectedUser.email ?? '—'}</span>
              </p>
              <p className="text-xs text-text-muted">
                Rol:{' '}
                <span className="text-text-secondary">{selectedUser.role}</span>
              </p>
            </div>
          )}

          {/* Checkbox Team Lead */}
          <label className="flex items-center gap-3 cursor-pointer select-none group pt-1">
            <input
              type="checkbox"
              checked={isTeamLead}
              disabled={loading}
              onChange={e => setIsTeamLead(e.target.checked)}
              className="w-4 h-4 accent-accent-cyan disabled:opacity-50"
            />
            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
              {t('pages.teamPage.modal.fieldTeamLead', 'Es Team Lead')}
            </span>
          </label>

        </div>

        {/* Error */}
        {error && (
          <div className="mt-4 px-4 py-3 rounded-lg bg-severity-critical/10 border border-severity-critical/25">
            <p className="text-xs text-severity-critical">{error}</p>
          </div>
        )}

        {/* Acciones */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={handleSubmit}
            disabled={loading || loadingUsers || !selectedId}
            className="
              flex-1 py-2.5 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-accent-cyan to-accent-blue
              hover:opacity-90 active:opacity-80
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-opacity shadow-md
            "
          >
            {loading
              ? t('pages.teamPage.modal.btnAdding', 'Agregando...')
              : t('pages.teamPage.modal.btnAdd', 'Agregar Miembro')}
          </button>
          <button
            onClick={onClose}
            disabled={loading}
            className="
              px-5 py-2.5 rounded-xl text-sm font-medium
              border border-border-secondary text-text-secondary
              hover:text-text-primary hover:border-border-primary
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors
            "
          >
            {t('common.cancel', 'Cancelar')}
          </button>
        </div>

      </div>
    </div>
  );
}
