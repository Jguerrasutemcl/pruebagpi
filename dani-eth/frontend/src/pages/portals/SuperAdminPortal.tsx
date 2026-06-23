/**
 * SuperAdminPortal — Único contenido del portal Super Admin.
 *
 * Formulario para registrar una nueva empresa y su primer Admin.
 * Llama a POST /api/v1/companies (solo accesible con rol super_admin).
 */
import { useState } from 'react';
import { apiClient } from '@/lib/api';

interface FormState {
  company_name: string;
  company_slug: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
}

interface CreatedCompany {
  company_id: string;
  company_name: string;
  admin_uid: string;
  admin_email: string;
  created_at: string;
}

export default function SuperAdminPortal() {
  const [form, setForm] = useState<FormState>({
    company_name: '',
    company_slug: '',
    admin_name: '',
    admin_email: '',
    admin_password: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedCompany | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({
      ...prev,
      [name]: value,
      // Auto-generar slug desde el nombre de la empresa
      ...(name === 'company_name' && {
        company_slug: value
          .toLowerCase()
          .replace(/\s+/g, '-')
          .replace(/[^a-z0-9-]/g, ''),
      }),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const { data } = await apiClient.post<CreatedCompany>('/api/v1/companies', {
        company_name: form.company_name,
        company_slug: form.company_slug,
        admin: {
          email: form.admin_email,
          password: form.admin_password,
          name: form.admin_name,
        },
      });
      setCreated(data);
      setForm({ company_name: '', company_slug: '', admin_name: '', admin_email: '', admin_password: '' });
    } catch (err: unknown) {
      const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
      setError(typeof detail === 'string' ? detail : 'Error al crear la empresa.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary">Registrar Nueva Empresa</h1>
        <p className="text-text-muted mt-1 text-sm">
          Crea una empresa y su primer administrador. Los roles operativos los asigna el Admin de empresa.
        </p>
      </div>

      {/* Confirmación de éxito */}
      {created && (
        <div className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl">
          <p className="text-green-400 font-semibold text-sm">✅ Empresa creada exitosamente</p>
          <p className="text-text-muted text-sm mt-1">
            <span className="text-text-primary font-medium">ID:</span>{' '}
            <code className="text-accent-cyan">{created.company_id}</code>{' · '}
            <span className="text-text-primary font-medium">Admin:</span>{' '}
            {created.admin_email}
          </p>
          <p className="text-text-muted text-xs mt-1">
            El Admin debe iniciar sesión con sus credenciales — los custom claims ya están configurados.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-bg-secondary border border-border-primary rounded-2xl p-6 space-y-5"
      >
        {/* Sección empresa */}
        <SectionHeader title="Datos de la Empresa" />

        <Field
          label="Nombre de la Empresa"
          name="company_name"
          value={form.company_name}
          onChange={handleChange}
          placeholder="Acme Security Corp"
          required
        />
        <Field
          label="Slug (ID único)"
          name="company_slug"
          value={form.company_slug}
          onChange={handleChange}
          placeholder="acme-security-corp"
          hint="Solo minúsculas, números y guiones. Se genera automáticamente desde el nombre."
          pattern="^[a-z0-9\-]+$"
          required
        />

        {/* Sección admin */}
        <SectionHeader title="Primer Admin de la Empresa" className="pt-2" />

        <Field
          label="Nombre del Admin"
          name="admin_name"
          value={form.admin_name}
          onChange={handleChange}
          placeholder="Carlos Gómez"
          required
        />
        <Field
          label="Email del Admin"
          name="admin_email"
          value={form.admin_email}
          onChange={handleChange}
          type="email"
          placeholder="admin@acme.com"
          required
        />
        <Field
          label="Contraseña temporal"
          name="admin_password"
          value={form.admin_password}
          onChange={handleChange}
          type="password"
          placeholder="Mínimo 8 caracteres"
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-accent-cyan text-bg-primary font-semibold rounded-xl hover:bg-accent-cyan/90 disabled:opacity-50 transition-colors mt-2"
        >
          {loading ? 'Creando empresa...' : 'Crear Empresa y Admin'}
        </button>
      </form>
    </div>
  );
}

// ── Componentes auxiliares ─────────────────────────────────────────────────────

function SectionHeader({ title, className = '' }: { title: string; className?: string }) {
  return (
    <div className={`border-b border-border-primary pb-3 ${className}`}>
      <h2 className="text-text-primary font-semibold text-sm uppercase tracking-wide">{title}</h2>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
  placeholder,
  hint,
  pattern,
  required,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  hint?: string;
  pattern?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="block text-text-primary text-sm font-medium mb-1.5">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        type={type}
        placeholder={placeholder}
        pattern={pattern}
        required={required}
        className="w-full px-4 py-2.5 bg-bg-primary border border-border-primary rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:border-accent-cyan focus:ring-1 focus:ring-accent-cyan/30 transition-colors text-sm"
      />
      {hint && <p className="text-text-muted text-xs mt-1">{hint}</p>}
    </div>
  );
}
