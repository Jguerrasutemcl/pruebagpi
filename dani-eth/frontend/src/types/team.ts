// frontend/src/types/team.ts

export interface Team {
  id: string;
  name: string;
  description: string | null;
  icon: string | null;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface TeamCreate {
  name: string;
  description?: string;
  icon?: string;
}

export interface TeamUpdate {
  name?: string;
  description?: string;
  icon?: string;
}

// ── Permisos y Notificaciones ──────────────────────────────

export interface MemberPermissions {
  view_dashboard:    boolean;
  run_scans:         boolean;
  vulnerability_hub: boolean;
  manage_patches:    boolean;
  team_management:   boolean;
  admin_settings:    boolean;
}

export interface MemberNotifications {
  email:        boolean;
  slack:        boolean;
  sms_critical: boolean;
  in_app:       boolean;
}

export interface MemberNotifyWhen {
  task_assigned:             boolean;
  critical_vulnerabilities:  boolean;
  daily_digest:              boolean;
}

// ── TeamMember ─────────────────────────────────────────────

export interface TeamMember {
  id: string;
  member_code: string;          // NET-001, APP-002
  firebase_uid: string | null;
  name: string;
  email: string;
  role: string;
  is_team_lead: boolean;
  team_id: string;
  team_name: string | null;
  active_tasks_count: number;
  completed_this_month: number;
  avg_completion_days: number;
  workload_pct: number;         // calculado por el backend
  workload_label: string;       // "Light Load" | "Medium Load" | "Overloaded"
  permissions: MemberPermissions;
  notifications: MemberNotifications;
  notify_when: MemberNotifyWhen;
  created_at: string;
  updated_at: string;
}

export interface TeamMemberCreate {
  name: string;
  email: string;
  role: string;
  team_id: string;
  is_team_lead?: boolean;
  firebase_uid?: string;
  permissions?: Partial<MemberPermissions>;
  notifications?: Partial<MemberNotifications>;
  notify_when?: Partial<MemberNotifyWhen>;
}

export interface TeamMemberUpdate {
  name?: string;
  email?: string;
  role?: string;
  team_id?: string;
  is_team_lead?: boolean;
  active_tasks_count?: number;
  completed_this_month?: number;
  avg_completion_days?: number;
  permissions?: Partial<MemberPermissions>;
  notifications?: Partial<MemberNotifications>;
  notify_when?: Partial<MemberNotifyWhen>;
}

// ── Asset ──────────────────────────────────────────────────

export type AssetType = 'web_app' | 'api' | 'server' | 'network' | 'database' | 'mobile';
export type AssetStatus = 'active' | 'inactive' | 'maintenance';
export type AssetEnvironment = 'production' | 'staging' | 'development';

export interface Asset {
  id: string;
  name: string;
  hostname: string;
  ip_address: string | null;
  asset_type: AssetType;
  status: AssetStatus;
  environment: AssetEnvironment;
  description: string | null;
  team_id: string | null;
  team_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssetCreate {
  name: string;
  hostname: string;
  ip_address?: string;
  asset_type?: AssetType;
  status?: AssetStatus;
  environment?: AssetEnvironment;
  description?: string;
  team_id?: string;
}

export interface AssetUpdate {
  name?: string;
  hostname?: string;
  ip_address?: string;
  asset_type?: AssetType;
  status?: AssetStatus;
  environment?: AssetEnvironment;
  description?: string;
  team_id?: string;
}

// ── Stats ──────────────────────────────────────────────────

export interface TeamStats {
  total_members: number;
  total_teams: number;
  active_tasks: number;
  overloaded_count: number;
  available_count: number;
  avg_completion_days: number;
}