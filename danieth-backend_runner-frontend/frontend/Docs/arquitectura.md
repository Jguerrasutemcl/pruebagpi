# Arquitectura del Frontend — DANI-ETH

## Stack tecnológico

| | |
|---|---|
| Lenguaje | TypeScript estricto |
| Framework | React 18 — hooks funcionales, cero clases |
| Bundler | Vite |
| Routing | React Router v6 (`createBrowserRouter`) |
| Estilos | Tailwind CSS + variables CSS globales |
| HTTP | Axios vía `apiClient` (`src/lib/api.ts`) |
| i18n | `react-i18next` |
| Auth | Firebase (Google Auth) |

## Estructura de carpetas

```
src/
├── components/
│   ├── auth/         ← ProtectedRoute (guarda de autenticación)
│   ├── dashboard/    ← widgets del dashboard (no tocar)
│   ├── layout/       ← DashboardLayout, Sidebar, Header (no tocar)
│   └── team/         ← componentes de TeamAssets
├── contexts/
│   ├── AuthContext.tsx   ← proveedor de Firebase Auth (no tocar)
│   └── ThemeContext.tsx  ← toggle dark/light (no tocar)
├── lib/
│   ├── api.ts            ← cliente HTTP Axios + interceptores JWT
│   ├── firebase.ts       ← configuración de Firebase (no tocar)
│   ├── herramientas.ts   ← funciones de API para el Runner (puerto 8003/8004)
│   ├── i18n.ts           ← configuración de react-i18next
│   └── socket.ts         ← cliente WebSocket del dashboard
├── locales/              ← archivos de traducción (es, en, de, fr)
├── pages/                ← una página por ruta
├── services/
│   └── teamService.ts    ← lógica de negocio del equipo
├── styles/
│   └── globals.css       ← variables CSS + reset
└── types/                ← tipos TypeScript compartidos
```

## Routing (`src/router.tsx`)

El router usa `createBrowserRouter`. Todas las rutas privadas están anidadas bajo `ProtectedRoute`, que verifica el estado de autenticación de Firebase.

```
/login              → LoginPage          (público)
/register           → RegisterPage       (público)
/dashboard          → DashboardPage      (protegido)
/vulnerabilities    → VulnerabilityHubPage
/ai-pentesting      → AIPentestingPage   ← MODIFICAR
/patches            → PatchManagerPage
/team               → TeamAssetsPage
/reports            → ReportsPage        ← MODIFICAR
/settings           → SettingsPage
/setup              → SetupCheckPage
```

**El router NO se modifica.** Las rutas `/ai-pentesting` y `/reports` ya existen.

## Dos backends distintos

El frontend consume dos backends simultáneamente:

| Backend | Puerto | Prefijo de ruta |
|---|---|---|
| **Runner** (equipo externo) | 8003 / 8004 | `/proxy/*` |
| **Orquestador** (nuestro) | 8000 | `/campaign/*` y `/campaign/reports/*` |

Ambos se consumen con el mismo `apiClient`. La distinción está en el path de la URL, no en el cliente.

## Flujo de autenticación

1. El usuario hace login con Firebase (email/password o Google).
2. `AuthContext` persiste el estado del usuario.
3. `ProtectedRoute` redirige a `/login` si no hay sesión.
4. El interceptor de `apiClient` inyecta automáticamente el JWT de Firebase en cada request (`Authorization: Bearer <token>`).

El frontend **nunca** maneja tokens manualmente. El interceptor lo hace por detrás.
