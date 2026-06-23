// src/components/team/MemberCard.tsx
import { useTranslation } from 'react-i18next';
import type { TeamMember, MemberPermissions, MemberNotifications, MemberNotifyWhen } from '@/types/team';

// ── Defaults seguros (se usan si Firestore devuelve el campo vacío o undefined) ──
const DEFAULT_PERMISSIONS: MemberPermissions = {
  view_dashboard:    true,
  run_scans:         false,
  vulnerability_hub: false,
  manage_patches:    false,
  team_management:   false,
  admin_settings:    false,
};

const DEFAULT_NOTIFICATIONS: MemberNotifications = {
  email:        true,
  slack:        true,
  sms_critical: false,
  in_app:       true,
};

const DEFAULT_NOTIFY_WHEN: MemberNotifyWhen = {
  task_assigned:            true,
  critical_vulnerabilities: true,
  daily_digest:             false,
};

// ── Colores de avatar ──────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'from-cyan-500 to-blue-600',
  'from-violet-500 to-purple-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-amber-600',
  'from-pink-500 to-rose-600',
  'from-sky-500 to-indigo-600',
];

function getAvatarGradient(name: string): string {
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return AVATAR_COLORS[code % AVATAR_COLORS.length];
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .map(w => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

// ── WorkloadBar ────────────────────────────────────────────────────────────────
interface WorkloadBarProps {
  pct: number;
  label: string;
}

function WorkloadBar({ pct, label }: WorkloadBarProps) {
  const { t } = useTranslation();
  const colorBar  = pct >= 70 ? 'bg-severity-critical' : pct >= 40 ? 'bg-severity-medium' : 'bg-severity-low';
  const colorText = pct >= 70 ? 'text-severity-critical' : pct >= 40 ? 'text-severity-medium' : 'text-severity-low';

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-1.5">
        <span className="text-xs text-text-muted">
          {t('pages.teamPage.member.workload.label')}
        </span>
        <span className={`text-xs font-bold ${colorText}`}>
          {label} ({pct}%)
        </span>
      </div>
      <div className="w-full bg-bg-quaternary rounded-full h-2 overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ease-out ${colorBar}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ── CheckRow ───────────────────────────────────────────────────────────────────
interface CheckRowProps {
  checked: boolean;
  label: string;
}

function CheckRow({ checked, label }: CheckRowProps) {
  return (
    <label className="flex items-center gap-2.5 select-none">
      <input
        type="checkbox"
        readOnly
        checked={checked}
        className="w-3.5 h-3.5 accent-accent-cyan cursor-default"
        tabIndex={-1}
      />
      <span className="text-xs text-text-secondary">{label}</span>
    </label>
  );
}

// ── MemberCard ─────────────────────────────────────────────────────────────────
interface MemberCardProps {
  member: TeamMember;
  onEdit: (member: TeamMember) => void;
  onDelete: (memberId: string) => void;
}

export default function MemberCard({ member, onEdit, onDelete }: MemberCardProps) {
  const { t } = useTranslation();

  // ── Fallbacks defensivos: si Firestore devuelve undefined, usamos defaults ──
  const permissions  = member.permissions  ?? DEFAULT_PERMISSIONS;
  const notifications = member.notifications ?? DEFAULT_NOTIFICATIONS;
  const notifyWhen   = member.notify_when   ?? DEFAULT_NOTIFY_WHEN;

  const workloadPct   = member.workload_pct   ?? 0;
  const workloadLabel = member.workload_label ?? 'Light Load';

  const initials = getInitials(member.name ?? '?');
  const gradient = getAvatarGradient(member.name ?? '');

  const workloadLabelKey =
    workloadLabel === 'Overloaded'   ? 'pages.teamPage.member.workload.overloaded' :
    workloadLabel === 'Medium Load'  ? 'pages.teamPage.member.workload.medium'     :
                                       'pages.teamPage.member.workload.light';

  return (
    <article className="bg-bg-secondary border border-border-primary rounded-xl p-6 mb-4 transition-colors hover:border-border-secondary">

      {/* ── Header ── */}
      <div className="flex items-start gap-4 mb-5">
        <div className="relative flex-shrink-0">
          <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
            {initials}
          </div>
          {member.is_team_lead && (
            <span className="absolute -bottom-1 -right-1 w-5 h-5 bg-accent-cyan rounded-full flex items-center justify-center text-[9px]" title={t('pages.teamPage.member.teamLead')}>
              ⭐
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-0.5">
            <h3 className="text-base font-bold text-text-primary leading-tight">
              {member.name}
            </h3>
            {member.is_team_lead && (
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/25 tracking-wide">
                {t('pages.teamPage.member.teamLead')}
              </span>
            )}
          </div>
          <p className="text-sm text-text-secondary">{member.role}</p>
          <p className="text-xs text-text-muted mt-0.5">✉ {member.email}</p>
          <p className="text-xs text-text-muted mt-0.5">
            {t('pages.teamPage.member.idLabel')} {member.member_code}
          </p>
        </div>

        <div className="flex gap-2 flex-shrink-0">
          <button
            onClick={() => onEdit(member)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border-secondary text-text-secondary hover:text-text-primary hover:border-border-primary transition-colors"
          >
            {t('pages.teamPage.member.actions.edit')}
          </button>
          <button
            onClick={() => onDelete(member.id)}
            className="px-3 py-1.5 text-xs font-medium rounded-lg border border-severity-critical/30 text-severity-critical hover:bg-severity-critical/10 transition-colors"
          >
            {t('pages.teamPage.member.actions.delete')}
          </button>
        </div>
      </div>

      {/* ── Workload ── */}
      <div className="bg-bg-tertiary border border-border-primary rounded-xl p-4 mb-4">
        <WorkloadBar pct={workloadPct} label={t(workloadLabelKey)} />
        <p className="text-sm text-text-secondary mt-3">
          {t('pages.teamPage.member.activeTasks', {
            count: member.active_tasks_count ?? 0,
          })}
        </p>
        <div className="grid grid-cols-2 gap-6 mt-4">
          <div>
            <p className="text-xs text-text-muted mb-1">{t('pages.teamPage.member.completedMonth')}</p>
            <p className="text-2xl font-bold text-severity-low">
              {member.completed_this_month ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-text-muted mb-1">{t('pages.teamPage.member.avgCompletion')}</p>
            <p className="text-2xl font-bold text-accent-cyan">
              {member.avg_completion_days ?? 0}d
            </p>
          </div>
        </div>
        <button className="mt-4 text-xs text-text-muted hover:text-text-secondary transition-colors underline underline-offset-2">
          📋 {t('pages.teamPage.member.viewReassign')}
        </button>
      </div>

      {/* ── Permisos + Notificaciones ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-bg-tertiary border border-border-primary rounded-xl p-4">
          <p className="text-xs font-bold text-text-primary uppercase tracking-wide mb-3">
            {t('pages.teamPage.member.permissions.title')}
          </p>
          <div className="space-y-2.5">
            <CheckRow checked={permissions.view_dashboard}    label={t('pages.teamPage.member.permissions.viewDashboard')} />
            <CheckRow checked={permissions.run_scans}         label={t('pages.teamPage.member.permissions.runScans')} />
            <CheckRow checked={permissions.vulnerability_hub} label={t('pages.teamPage.member.permissions.vulnerabilityHub')} />
            <CheckRow checked={permissions.manage_patches}    label={t('pages.teamPage.member.permissions.managePatches')} />
            <CheckRow checked={permissions.team_management}   label={t('pages.teamPage.member.permissions.teamManagement')} />
            <CheckRow checked={permissions.admin_settings}    label={t('pages.teamPage.member.permissions.adminSettings')} />
          </div>
        </div>

        <div className="bg-bg-tertiary border border-border-primary rounded-xl p-4">
          <p className="text-xs font-bold text-text-primary uppercase tracking-wide mb-3">
            {t('pages.teamPage.member.notifications.title')}
          </p>
          <div className="space-y-2.5">
            <CheckRow checked={notifications.email}        label={t('pages.teamPage.member.notifications.email')} />
            <CheckRow checked={notifications.slack}        label={t('pages.teamPage.member.notifications.slack')} />
            <CheckRow checked={notifications.sms_critical} label={t('pages.teamPage.member.notifications.sms')} />
            <CheckRow checked={notifications.in_app}       label={t('pages.teamPage.member.notifications.inApp')} />
          </div>
          <p className="text-xs text-text-muted mt-4 mb-2 font-medium">
            {t('pages.teamPage.member.notifications.notifyWhen')}
          </p>
          <div className="space-y-2.5">
            <CheckRow checked={notifyWhen.task_assigned}            label={t('pages.teamPage.member.notifications.taskAssigned')} />
            <CheckRow checked={notifyWhen.critical_vulnerabilities} label={t('pages.teamPage.member.notifications.criticalVuln')} />
            <CheckRow checked={notifyWhen.daily_digest}             label={t('pages.teamPage.member.notifications.dailyDigest')} />
          </div>
        </div>

      </div>
    </article>
  );
}