export interface Scope {
  scan_type: 'full' | 'quick' | 'custom';
  ports: string;
  categories: Array<'ports' | 'web' | 'vuln' | 'os'>;
}

export interface Target {
  target_id: string;
  name: string;
  target: string;
  description: string | null;
  scope: Scope;
  created_at: string;
  updated_at: string | null;
}

export interface TargetCreate {
  name: string;
  target: string;
  description?: string;
  scope?: Partial<Scope>;
}

export interface TargetUpdate {
  name?: string;
  description?: string;
  scope?: Partial<Scope>;
}