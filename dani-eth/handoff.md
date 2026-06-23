# DANI-ETH — Handoff

**Rama:** `integracion-visual`  
**Fecha última actualización:** 2026-06-14

> **Nota:** Este documento es una guía rápida para continuar el desarrollo. Para la documentación completa de arquitectura, setup y flujos, consulta **`ESTRUCTURA.md`** y **`README.md`**.

---

## 1. Próximos Pasos y Prioridades

### Prioridad Alta
1.  **Crear Super Admin inicial (manual, una sola vez):** Crear usuario en Firebase, escribir custom claims `{role: "super_admin"}` y perfil en Firestore.
2.  **Configurar credenciales locales:** Asegurarse de que `backend/.env` y `frontend/.env` están completos y que `firebase-admin-key.json` está en su sitio.
3.  **Probar flujo E2E:** Super Admin crea empresa → Admin de empresa inicia sesión y crea usuario operativo → Usuario operativo inicia sesión y verifica aislamiento.

### Prioridad Media
4.  **Índices Firestore:** La ordenación en consultas complejas falla. La solución temporal es ordenar en Python. La solución definitiva es crear los índices compuestos que Firestore sugiere en los logs de error.
5.  **Conectar Orquestador:** Levantar el `mock_orquestador.py` en `http://localhost:8001` para poder trabajar en las páginas de `AIPentesting`, `VulnerabilityHub`, etc.

### Prioridad Baja
6.  **Invitación por email:** Reemplazar la creación de usuarios con contraseña temporal por un flujo de invitación (`sendSignInLinkToEmail`).

---

## 2. Resumen de la Última Sesión (2026-06-14)

| Fecha | Sesión | Cambios principales |
|-------|--------|---------------------|
| 2026-06-14 | CRUD Usuarios y consistencia | Se implementó el borrado y edición de rol de usuarios en el portal de Admin. Se refactorizó el modal de "Añadir Miembro" para usar usuarios reales del sistema. Se implementó la lógica de borrado y actualización en cascada en el backend (`users` → `team_members`). |

---

## 3. Estado Actual

| Funcionalidad | Estado |
|---------------|--------|
| Login / Registro | ✅ Funciona | El registro público asigna rol `viewer` sin empresa. |
| Portales por Rol | ✅ Funciona | Redirección automática a `/super-admin`, `/company-admin` o `/dashboard`. |
| Portal Super Admin | ✅ Funciona | Creación de empresas y su primer Admin. |
| Portal Admin Empresa | ✅ Funciona | Gestión de usuarios, equipos y activos de su empresa. |
| Aislamiento de Datos | ✅ Funciona | El `company_id` en el JWT filtra los datos en el backend. |
| CRUD de Usuarios | ✅ Funciona | Creación, listado, edición de rol y borrado (con cascada a `team_members`). |
| CRUD de Equipos | ✅ Funciona | El modal de añadir miembro ahora usa usuarios reales del sistema. |
| Módulos de Pentesting | ⚠️ Bloqueado | `AIPentesting`, `VulnerabilityHub`, etc., necesitan el orquestador. |
| Reportes | ⚠️ Bloqueado | Necesita configuración de Supabase. |
