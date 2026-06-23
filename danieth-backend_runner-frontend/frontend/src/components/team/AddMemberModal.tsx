// src/components/team/AddMemberModal.tsx
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { teamService } from '@/services/teamService';
import type { TeamMemberCreate } from '@/types/team';

interface AddMemberModalProps {
  teamId: string;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormState {
  name: string;
  email: string;
  role: string;
  is_team_lead: boolean;
}

const INITIAL_FORM: FormState = {
  name: '',
  email: '',
  role: '',
  is_team_lead: false,
};

// Campo de texto reutilizable dentro del modal
interface FieldProps {
  id: string;
  label: string;
  placeholder: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
}

function Field({ id, label, placeholder, type = 'text', value, onChange, disabled }: FieldProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-xs font-medium text-text-muted mb-1.5"
      >
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        onChange={e => onChange(e.target.value)}
        className="
          w-full bg-bg-tertiary border border-border-secondary rounded-lg
          px-3 py-2.5 text-sm text-text-primary placeholder:text-text-muted
          focus:outline-none focus:ring-2 focus:ring-accent-cyan focus:border-transparent
          disabled:opacity-50 disabled:cursor-not-allowed
          transition-colors
        "
      />
    </div>
  );
}

export default function AddMemberModal({ teamId, onClose, onSuccess }: AddMemberModalProps) {
  const { t } = useTranslation();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const setField = useCallback(
    <K extends keyof FormState>(key: K, value: FormState[K]) => {
      setForm(prev => ({ ...prev, [key]: value }));
      setError('');
    },
    []
  );

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.email.trim() || !form.role.trim()) {
      setError(t('pages.teamPage.modal.errorRequired'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: TeamMemberCreate = {
        name: form.name.trim(),
        email: form.email.trim(),
        role: form.role.trim(),
        team_id: teamId,
        is_team_lead: form.is_team_lead,
      };
      await teamService.createMember(teamId, payload);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })
        ?.response?.data?.detail;
      setError(detail ?? t('pages.teamPage.modal.errorApi'));
    } finally {
      setLoading(false);
    }
  };

  // Cerrar con Escape
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && !loading) onClose();
  };

  return (
    /* Fondo oscuro */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Overlay para cerrar */}
      <div
        className="absolute inset-0"
        onClick={!loading ? onClose : undefined}
      />

      {/* Card del modal */}
      <div className="relative z-10 w-full max-w-md bg-bg-secondary border border-border-primary rounded-2xl shadow-2xl p-6">

        {/* Título */}
        <h2
          id="modal-title"
          className="text-base font-bold text-text-primary mb-5"
        >
          {t('pages.teamPage.modal.addTitle')}
        </h2>

        {/* Campos */}
        <div className="space-y-4">
          <Field
            id="member-name"
            label={t('pages.teamPage.modal.fieldName')}
            placeholder={t('pages.teamPage.modal.fieldNamePlaceholder')}
            value={form.name}
            onChange={v => setField('name', v)}
            disabled={loading}
          />
          <Field
            id="member-email"
            label={t('pages.teamPage.modal.fieldEmail')}
            placeholder={t('pages.teamPage.modal.fieldEmailPlaceholder')}
            type="email"
            value={form.email}
            onChange={v => setField('email', v)}
            disabled={loading}
          />
          <Field
            id="member-role"
            label={t('pages.teamPage.modal.fieldRole')}
            placeholder={t('pages.teamPage.modal.fieldRolePlaceholder')}
            value={form.role}
            onChange={v => setField('role', v)}
            disabled={loading}
          />

          {/* Checkbox Team Lead */}
          <label className="flex items-center gap-3 cursor-pointer select-none group">
            <input
              type="checkbox"
              checked={form.is_team_lead}
              disabled={loading}
              onChange={e => setField('is_team_lead', e.target.checked)}
              className="w-4 h-4 accent-accent-cyan disabled:opacity-50"
            />
            <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
              {t('pages.teamPage.modal.fieldTeamLead')}
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
            disabled={loading}
            className="
              flex-1 py-2.5 rounded-xl text-sm font-semibold text-white
              bg-gradient-to-r from-accent-cyan to-accent-blue
              hover:opacity-90 active:opacity-80
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-opacity shadow-md
            "
          >
            {loading
              ? t('pages.teamPage.modal.btnAdding')
              : t('pages.teamPage.modal.btnAdd')}
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
            {t('common.cancel')}
          </button>
        </div>
      </div>
    </div>
  );
}