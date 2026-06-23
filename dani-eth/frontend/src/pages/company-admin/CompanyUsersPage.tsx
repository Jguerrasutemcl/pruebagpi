/**
 * CompanyUsersPage — Gestión de usuarios de la empresa.
 *
 * Solo accesible por el Admin de empresa (company-admin portal).
 * Permite listar, crear, cambiar el rol y eliminar usuarios operativos.
 * Llama a:
 *   GET    /api/v1/users              — listar usuarios filtrados por company_id
 *   POST   /api/v1/users/company      — crear usuario operativo en esta empresa
 *   PUT    /api/v1/users/{id}/role    — cambiar el rol de un usuario
 *   DELETE /api/v1/users/{id}         — eliminar un usuario de la empresa
 */
import { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api';

interface CompanyUser {
  user_id: string;
  name: string | null;
  email: string | null;
  role: string;
  company_id: string | null;
}

interface CreateUserForm {
  name: string;
  email: string;
  password: string;
  role: string;
}

const OPERATIONAL_ROLES = [
  { value: 'security_engineer', label: 'Security Engineer' },
  { value: 'pentester',         label: 'Pentester' },
  { value: 'analyst',           label: 'Analista' },
  { value: 'viewer',            label: 'Solo lectura' },
];

const ROLE_STYLES: Record<string, string> = {
  security_engineer: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  pentester:         'text-orange-400 bg-orange-400/10 border-orange-400/30',
  analyst:           'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  viewer:            'text-gray-400 bg-gray-400/10 border-gray-400/30',
  admin:             'text-accent-cyan bg-accent-cyan/10 border-accent-cyan/30',
};

export default function CompanyUsersPage() {
  const [users, setUsers]             = useState<CompanyUser[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [form, setForm]               = useState<CreateUserForm>({
    name: '', email: '', password: '', role: 'analyst',
  });
  const [creating, setCreating]       = useState(false);
  const [formError, setFormError]     = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Inline-edit state
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [pendingRole, setPendingRole]   = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError]   = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoadingList(true);
    try {
      const { data } = await apiClient.get<CompanyUser[]>('/api/v1/users');
      setUsers(data);
    } catch {
      // keep list empty on error
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // ── Crear usuario ────────────────────────────────────────────────────────────

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setCreating(true);
    try {
      await apiClient.post('/api/v1/users/company', form);
      setFormSuccess(`Usuario ${form.email} creado con rol ${form.role}.`);
      setForm({ name: '', email: '', password: '', role: 'analyst' });
      setShowForm(false);
      await fetchUsers();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setFormError(typeof detail === 'string' ? detail : 'Error al crear el usuario.');
    } finally {
      setCreating(false);
    }
  };

  // ── Editar rol ───────────────────────────────────────────────────────────────

  const startEdit = (u: CompanyUser) => {
    setEditingId(u.user_id);
    setPendingRole(u.role);
    setActionError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setActionError(null);
  };

  const handleSaveRole = async (userId: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await apiClient.put(`/api/v1/users/${userId}/role`, { role: pendingRole });
      setEditingId(null);
      await fetchUsers();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setActionError(typeof detail === 'string' ? detail : 'Error al cambiar el rol.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Eliminar usuario ─────────────────────────────────────────────────────────

  const handleDelete = async (u: CompanyUser) => {
    if (!window.confirm(`¿Eliminar a ${u.name ?? u.email}? Esta acción no se puede deshacer.`)) return;
    setActionLoading(true);
    setActionError(null);
    try {
      await apiClient.delete(`/api/v1/users/${u.user_id}`);
      await fetchUsers();
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setActionError(typeof detail === 'string' ? detail : 'Error al eliminar el usuario.');
    } finally {
      setActionLoading(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Usuarios de la Empresa</h1>
          <p className="text-text-muted text-sm mt-0.5">
            {loadingList ? 'Cargando...' : `${users.length} usuario${users.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        <button
          onClick={() => { setShowForm(v => !v); setFormError(null); setFormSuccess(null); }}
          className="px-4 py-2 bg-accent-cyan text-bg-primary font-semibold rounded-lg hover:bg-accent-cyan/90 transition-colors text-sm"
        >
          {showForm ? 'Cancelar' : '+ Nuevo Usuario'}
        </button>
      </div>

      {/* Mensaje de éxito de creación */}
      {formSuccess && (
        <div className="mb-4 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
          <p className="text-green-400 text-sm">✅ {formSuccess}</p>
        </div>
      )}

      {/* Error de acción (editar/eliminar) */}
      {actionError && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm">⚠️ {actionError}</p>
        </div>
      )}

      {/* Formulario de creación */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mb-6 bg-bg-secondary border border-border-primary rounded-2xl p-6 space-y-4"
        >
          <h2 className="text-text-primary font-semibold">Crear Usuario Operativo</h2>
          {formError && <p className="text-red-400 text-sm">{formError}</p>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              label="Nombre completo"
              value={form.name}
              onChange={v => setForm(p => ({ ...p, name: v }))}
              placeholder="Ana García"
              required
            />
            <FormField
              label="Email"
              value={form.email}
              onChange={v => setForm(p => ({ ...p, email: v }))}
              type="email"
              placeholder="ana@empresa.com"
              required
            />
            <FormField
              label="Contraseña temporal"
              value={form.password}
              onChange={v => setForm(p => ({ ...p, password: v }))}
              type="password"
              placeholder="Mín. 8 caracteres"
              required
            />
            <div>
              <label className="block text-text-primary text-sm font-medium mb-1.5">Rol</label>
              <select
                value={form.role}
                onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full px-4 py-2.5 bg-bg-primary border border-border-primary rounded-lg text-text-primary focus:outline-none focus:border-accent-cyan text-sm"
              >
                {OPERATIONAL_ROLES.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="px-5 py-2.5 bg-accent-cyan text-bg-primary font-semibold rounded-lg hover:bg-accent-cyan/90 disabled:opacity-50 transition-colors text-sm"
          >
            {creating ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>
      )}

      {/* Tabla de usuarios */}
      {loadingList ? (
        <div className="flex justify-center py-12">
          <div className="w-8 h-8 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-12 text-text-muted">
          <p className="text-4xl mb-3">👥</p>
          <p>Aún no hay usuarios en esta empresa.</p>
          <p className="text-sm mt-1">Usa el botón "+ Nuevo Usuario" para invitar al equipo.</p>
        </div>
      ) : (
        <div className="bg-bg-secondary border border-border-primary rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="border-b border-border-primary">
              <tr>
                {['Nombre', 'Email', 'Rol', 'Acciones'].map(h => (
                  <th key={h} className="text-left px-5 py-3.5 text-text-muted font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr
                  key={u.user_id}
                  className="border-b border-border-primary/50 last:border-0 hover:bg-bg-primary/30 transition-colors"
                >
                  <td className="px-5 py-3.5 text-text-primary">{u.name ?? '—'}</td>
                  <td className="px-5 py-3.5 text-text-muted">{u.email ?? '—'}</td>

                  {/* Celda de rol: badge normal o selector inline */}
                  <td className="px-5 py-3.5">
                    {editingId === u.user_id ? (
                      <select
                        value={pendingRole}
                        onChange={e => setPendingRole(e.target.value)}
                        disabled={actionLoading}
                        className="px-2 py-1 bg-bg-primary border border-accent-cyan rounded-lg text-text-primary text-xs focus:outline-none"
                      >
                        {OPERATIONAL_ROLES.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    ) : (
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                          ROLE_STYLES[u.role] ?? 'text-text-muted border-border-primary'
                        }`}
                      >
                        {u.role}
                      </span>
                    )}
                  </td>

                  {/* Celda de acciones */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      {editingId === u.user_id ? (
                        <>
                          <button
                            onClick={() => handleSaveRole(u.user_id)}
                            disabled={actionLoading}
                            className="px-3 py-1 text-xs font-semibold rounded-lg bg-accent-cyan text-bg-primary hover:bg-accent-cyan/90 disabled:opacity-50 transition-colors"
                          >
                            {actionLoading ? '...' : 'Guardar'}
                          </button>
                          <button
                            onClick={cancelEdit}
                            disabled={actionLoading}
                            className="px-3 py-1 text-xs font-medium rounded-lg border border-border-secondary text-text-muted hover:text-text-primary transition-colors"
                          >
                            Cancelar
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEdit(u)}
                            disabled={actionLoading || u.role === 'admin'}
                            title={u.role === 'admin' ? 'No se puede cambiar el rol del Admin' : 'Cambiar rol'}
                            className="px-3 py-1 text-xs font-medium rounded-lg border border-border-secondary text-text-muted hover:text-text-primary hover:border-border-primary disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(u)}
                            disabled={actionLoading || u.role === 'admin'}
                            title={u.role === 'admin' ? 'No se puede eliminar al Admin' : 'Eliminar usuario'}
                            className="px-3 py-1 text-xs font-medium rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            Eliminar
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ── Campo de formulario reutilizable ──────────────────────────────────────────

function FormField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-text-primary text-sm font-medium mb-1.5">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        type={type}
        placeholder={placeholder}
        required={required}
        className="w-full px-4 py-2.5 bg-bg-primary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan text-sm"
      />
    </div>
  );
}
