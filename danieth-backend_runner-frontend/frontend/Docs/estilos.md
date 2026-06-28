# Sistema de Estilos

## Variables CSS globales (`src/styles/globals.css`)

**Nunca usar colores hardcodeados.** Todas las páginas y componentes usan estas variables CSS, que cambian automáticamente entre tema dark y light.

### Fondos

```css
var(--bg-primary)      /* #0a0e17 — fondo de la página */
var(--bg-secondary)    /* #12161f — fondo de cards y paneles */
var(--bg-tertiary)     /* #1a1f2e — fondo de inputs y elementos activos */
var(--bg-quaternary)   /* #242938 — fondo de elementos anidados */
```

### Bordes

```css
var(--border-primary)    /* #1e2533 — borde estándar */
var(--border-secondary)  /* #2a3144 — borde más visible */
```

### Texto

```css
var(--text-primary)    /* #e4e6eb — texto principal */
var(--text-secondary)  /* #b8bcc8 — texto secundario */
var(--text-muted)      /* #8b92a8 — texto atenuado, labels, hints */
```

### Acentos

```css
var(--accent-cyan)   /* #00d4ff — acento principal, CTA primario */
var(--accent-blue)   /* #0066ff — acento secundario, gradientes */
```

### Severidades (semánticas)

```css
var(--severity-critical)  /* #ef4444 — rojo: error, crítico */
var(--severity-high)      /* #fb923c — naranja: advertencia, alto */
var(--severity-medium)    /* #f59e0b — amarillo: pausado, medio */
var(--severity-low)       /* #10b981 — verde: éxito, bajo, completado */
```

### Sombras

```css
var(--shadow-sm)
var(--shadow-md)
var(--shadow-lg)
```

## Tailwind CSS

El proyecto usa Tailwind para espaciado, layout, tipografía y estados. Las clases de color de Tailwind **no se usan** — solo las variables CSS en `style={{ }}`.

Ejemplos de patrones comunes en el proyecto:

```tsx
// Card estándar
<div
  className="p-6 rounded-xl border"
  style={{ background: 'var(--bg-secondary)', borderColor: 'var(--border-primary)' }}
>

// Input estándar
<input
  className="w-full px-2 py-1.5 rounded text-xs"
  style={{
    background: 'var(--bg-tertiary)',
    border: '1px solid var(--border-primary)',
    color: 'var(--text-primary)'
  }}
/>

// Botón primario (CTA)
<button
  className="px-6 py-2 rounded-lg text-sm font-bold active:scale-95 transition-all"
  style={{ background: 'var(--accent-cyan)', color: '#0a0e17' }}
>

// Botón deshabilitado
<button
  disabled
  className="... disabled:opacity-50"
  style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}
>

// Badge de estado
<span
  className="text-xs font-bold px-2 py-1 rounded"
  style={{ background: 'var(--bg-tertiary)', color: 'var(--accent-cyan)' }}
>
```

## Colores de estado de campaña

El orquestador devuelve un campo `estado`. Usar este mapeo de colores:

```ts
function colorEstadoCampaña(estado: string): string {
  if (estado === 'ejecutando') return 'var(--accent-cyan)';
  if (estado === 'pausado')    return 'var(--severity-medium)';
  if (estado === 'finalizado') return 'var(--severity-low)';
  if (estado === 'error')      return 'var(--severity-critical)';
  if (estado === 'detenido')   return 'var(--severity-high)';
  return 'var(--text-muted)'; // 'inactivo'
}
```

## Tailwind Typography y `react-markdown`

El proyecto **no tiene** `@tailwindcss/typography` instalado. Esto significa que las clases `prose` de Tailwind no funcionan.

Al renderizar markdown con `react-markdown`, usar un wrapper con estilos inline:

```tsx
import ReactMarkdown from 'react-markdown';

<div style={{ color: 'var(--text-secondary)', lineHeight: '1.7', fontSize: '0.875rem' }}>
  <ReactMarkdown>{reporte.contenido}</ReactMarkdown>
</div>
```

Si se quiere instalar el plugin de Typography para tener `prose`:

```bash
npm install -D @tailwindcss/typography
```

Y añadir en `tailwind.config.js`:

```js
plugins: [require('@tailwindcss/typography')]
```

Luego se puede usar `<ReactMarkdown className="prose prose-invert max-w-none text-sm">`.
