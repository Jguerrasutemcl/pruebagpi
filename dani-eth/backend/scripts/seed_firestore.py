# backend/scripts/seed_firestore.py
"""
Semilla de datos para Firestore — DANI-ETH Paso 4.

Crea:
  • 2 equipos:   Red Team  |  Blue Team
  • 5 miembros Red  (ofensivos: pentesters, exploit devs, OSINT)
  • 5 miembros Blue (defensivos: SOC analysts, incident response, threat hunters)
  • 6 assets de infraestructura repartidos entre ambos equipos

Uso:
    cd backend
    python scripts/seed_firestore.py

Requiere:
    • Archivo credentials/firebase-admin-key.json presente
    • Variables de entorno en .env (o que firebase_credentials_path apunte correcto)
"""

import sys
import os
from pathlib import Path
from datetime import datetime, timezone

# ── Asegura que el módulo `app` sea importable desde /backend ──────────────────
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.firebase import initialize_firebase, get_firestore


# ══════════════════════════════════════════════════════════════════════════════
#  HELPERS
# ══════════════════════════════════════════════════════════════════════════════

def utcnow() -> str:
    return datetime.now(timezone.utc).isoformat()


def calc_workload_label(active_tasks: int) -> str:
    if active_tasks <= 2:
        return "Light Load"
    if active_tasks <= 5:
        return "Medium Load"
    return "Overloaded"


# ── Permisos por rol ──────────────────────────────────────────────────────────

def permissions_for(role: str) -> dict:
    """Define permisos realistas según el rol del miembro."""
    base = {
        "view_dashboard":    True,
        "run_scans":         False,
        "vulnerability_hub": False,
        "manage_patches":    False,
        "team_management":   False,
        "admin_settings":    False,
    }
    overrides = {
        "Team Lead": {
            "run_scans": True, "vulnerability_hub": True,
            "manage_patches": True, "team_management": True,
        },
        "Senior Pentester": {
            "run_scans": True, "vulnerability_hub": True,
        },
        "Pentester": {
            "run_scans": True, "vulnerability_hub": True,
        },
        "Exploit Developer": {
            "run_scans": True, "vulnerability_hub": True,
        },
        "OSINT Specialist": {
            "run_scans": True,
        },
        "SOC Analyst": {
            "vulnerability_hub": True,
        },
        "Senior SOC Analyst": {
            "vulnerability_hub": True, "manage_patches": True,
        },
        "Incident Responder": {
            "vulnerability_hub": True, "manage_patches": True,
        },
        "Threat Hunter": {
            "run_scans": True, "vulnerability_hub": True,
        },
        "Security Engineer": {
            "run_scans": True, "vulnerability_hub": True,
            "manage_patches": True, "team_management": True,
        },
        "Admin": {
            "run_scans": True, "vulnerability_hub": True,
            "manage_patches": True, "team_management": True,
            "admin_settings": True,
        },
    }
    base.update(overrides.get(role, {}))
    return base


def notifications_for(is_lead: bool) -> dict:
    return {
        "email":        True,
        "slack":        True,
        "sms_critical": is_lead,    # Solo leads reciben SMS
        "in_app":       True,
    }


def notify_when_for(role: str) -> dict:
    return {
        "task_assigned":             True,
        "critical_vulnerabilities":  True,
        "daily_digest":              role in ("Team Lead", "Security Engineer", "Admin"),
    }


# ══════════════════════════════════════════════════════════════════════════════
#  DATOS DE SEMILLA
# ══════════════════════════════════════════════════════════════════════════════

TEAMS = [
    {
        "_key": "red",
        "name": "Red Team",
        "description": "Equipo ofensivo: simulación de ataques, pentesting y exploit development.",
        "icon": "🔴",
    },
    {
        "_key": "blue",
        "name": "Blue Team",
        "description": "Equipo defensivo: monitoreo SOC, respuesta a incidentes y threat hunting.",
        "icon": "🔵",
    },
]

# Cada miembro lleva: name, email, role, is_team_lead, active_tasks_count,
#                     completed_this_month, avg_completion_days
MEMBERS = {
    "red": [
        {
            "name":                  "Carlos Mendoza",
            "email":                 "c.mendoza@dani-eth.io",
            "role":                  "Team Lead",
            "is_team_lead":          True,
            "active_tasks_count":    4,
            "completed_this_month":  14,
            "avg_completion_days":   2.5,
        },
        {
            "name":                  "Valentina Rojas",
            "email":                 "v.rojas@dani-eth.io",
            "role":                  "Senior Pentester",
            "is_team_lead":          False,
            "active_tasks_count":    6,
            "completed_this_month":  11,
            "avg_completion_days":   3.1,
        },
        {
            "name":                  "Diego Soto",
            "email":                 "d.soto@dani-eth.io",
            "role":                  "Exploit Developer",
            "is_team_lead":          False,
            "active_tasks_count":    3,
            "completed_this_month":  8,
            "avg_completion_days":   4.2,
        },
        {
            "name":                  "Fernanda Lima",
            "email":                 "f.lima@dani-eth.io",
            "role":                  "Pentester",
            "is_team_lead":          False,
            "active_tasks_count":    2,
            "completed_this_month":  9,
            "avg_completion_days":   2.8,
        },
        {
            "name":                  "Andrés Vega",
            "email":                 "a.vega@dani-eth.io",
            "role":                  "OSINT Specialist",
            "is_team_lead":          False,
            "active_tasks_count":    1,
            "completed_this_month":  6,
            "avg_completion_days":   1.9,
        },
    ],
    "blue": [
        {
            "name":                  "Sofía Herrera",
            "email":                 "s.herrera@dani-eth.io",
            "role":                  "Team Lead",
            "is_team_lead":          True,
            "active_tasks_count":    3,
            "completed_this_month":  16,
            "avg_completion_days":   2.2,
        },
        {
            "name":                  "Matías Fuentes",
            "email":                 "m.fuentes@dani-eth.io",
            "role":                  "Senior SOC Analyst",
            "is_team_lead":          False,
            "active_tasks_count":    5,
            "completed_this_month":  18,
            "avg_completion_days":   1.7,
        },
        {
            "name":                  "Camila Rivas",
            "email":                 "c.rivas@dani-eth.io",
            "role":                  "Incident Responder",
            "is_team_lead":          False,
            "active_tasks_count":    7,
            "completed_this_month":  12,
            "avg_completion_days":   3.5,
        },
        {
            "name":                  "Ignacio Parra",
            "email":                 "i.parra@dani-eth.io",
            "role":                  "Threat Hunter",
            "is_team_lead":          False,
            "active_tasks_count":    4,
            "completed_this_month":  10,
            "avg_completion_days":   2.9,
        },
        {
            "name":                  "Daniela Torres",
            "email":                 "d.torres@dani-eth.io",
            "role":                  "SOC Analyst",
            "is_team_lead":          False,
            "active_tasks_count":    2,
            "completed_this_month":  7,
            "avg_completion_days":   2.1,
        },
    ],
}

ASSETS = [
    # ── Red Team targets (ofensivo) ───────────────────────────────────────────
    {
        "name":        "API de Autenticación",
        "hostname":    "api.company.com",
        "ip_address":  "10.0.1.10",
        "asset_type":  "api",
        "status":      "active",
        "environment": "production",
        "description": "Endpoint principal de autenticación. Alta prioridad para Red Team.",
        "_team":       "red",
    },
    {
        "name":        "App Web Principal",
        "hostname":    "app.company.com",
        "ip_address":  "10.0.1.20",
        "asset_type":  "web_app",
        "status":      "active",
        "environment": "production",
        "description": "Aplicación web de cara al cliente. Evaluación OWASP Top 10.",
        "_team":       "red",
    },
    {
        "name":        "Admin Panel",
        "hostname":    "admin.company.com",
        "ip_address":  "10.0.1.30",
        "asset_type":  "web_app",
        "status":      "active",
        "environment": "production",
        "description": "Panel de administración interno. Acceso restringido.",
        "_team":       "red",
    },
    # ── Blue Team infrastructure (defensivo) ──────────────────────────────────
    {
        "name":        "Servidor de Correo",
        "hostname":    "mail.company.com",
        "ip_address":  "10.0.2.10",
        "asset_type":  "server",
        "status":      "active",
        "environment": "production",
        "description": "Servidor SMTP/IMAP corporativo. Monitoreo de phishing activo.",
        "_team":       "blue",
    },
    {
        "name":        "Base de Datos Principal",
        "hostname":    "db.company.com",
        "ip_address":  "10.0.2.20",
        "asset_type":  "database",
        "status":      "active",
        "environment": "production",
        "description": "PostgreSQL principal. Snapshots diarios y monitoreo de accesos.",
        "_team":       "blue",
    },
    {
        "name":        "Staging Environment",
        "hostname":    "staging.company.com",
        "ip_address":  "10.0.3.10",
        "asset_type":  "web_app",
        "status":      "maintenance",
        "environment": "staging",
        "description": "Entorno de pruebas pre-producción. Actualización en curso.",
        "_team":       "blue",
    },
]


# ══════════════════════════════════════════════════════════════════════════════
#  LÓGICA DE SEMILLA
# ══════════════════════════════════════════════════════════════════════════════

def prefix_for(team_name: str) -> str:
    name = team_name.lower()
    if "red"  in name: return "RED"
    if "blue" in name: return "BLU"
    if "network" in name: return "NET"
    if "app" in name:  return "APP"
    return "MBR"


def wipe_collection(db, collection_name: str) -> int:
    """Borra todos los documentos de una colección. Devuelve la cantidad borrada."""
    docs = list(db.collection(collection_name).stream())
    for doc in docs:
        doc.reference.delete()
    return len(docs)


def seed(wipe: bool = True):
    print("=" * 60)
    print("  DANI-ETH — Seed Firestore")
    print("=" * 60)

    # ── Inicializar Firebase ──────────────────────────────────────────────────
    ok = initialize_firebase()
    if not ok:
        print("\n❌  Firebase no inicializado.")
        print("    Verifica credentials/firebase-admin-key.json")
        sys.exit(1)

    db = get_firestore()
    print("\n✅  Firebase conectado\n")

    # ── Limpiar colecciones existentes (opcional) ─────────────────────────────
    if wipe:
        print("🧹  Limpiando colecciones previas...")
        for col in ("teams", "team_members", "assets"):
            n = wipe_collection(db, col)
            print(f"    • {col}: {n} documentos eliminados")
        print()

    # ── Crear equipos ─────────────────────────────────────────────────────────
    team_ids: dict[str, str] = {}   # _key → Firestore doc ID

    print("👥  Creando equipos...")
    for team_data in TEAMS:
        key = team_data.pop("_key")
        now = utcnow()
        payload = {**team_data, "created_at": now, "updated_at": now}

        ref = db.collection("teams").document()
        ref.set(payload)
        team_ids[key] = ref.id

        print(f"    • [{ref.id[:8]}…] {team_data['icon']} {team_data['name']}")

    print()

    # ── Crear miembros ────────────────────────────────────────────────────────
    print("🧑‍💻  Creando miembros...")
    total_members = 0

    for team_key, members_list in MEMBERS.items():
        team_id   = team_ids[team_key]
        team_name = next(t["name"] for t in TEAMS if True)   # lo buscamos bien abajo
        team_name = next(
            t["name"] for t in [
                {"name": "Red Team",  "_key": "red"},
                {"name": "Blue Team", "_key": "blue"},
            ] if t["_key"] == team_key
        )
        prefix = prefix_for(team_name)

        for idx, m in enumerate(members_list, start=1):
            member_code = f"{prefix}-{idx:03d}"
            now = utcnow()

            payload = {
                "member_code":          member_code,
                "firebase_uid":         None,
                "name":                 m["name"],
                "email":                m["email"],
                "role":                 m["role"],
                "is_team_lead":         m["is_team_lead"],
                "team_id":              team_id,
                "team_name":            team_name,
                "active_tasks_count":   m["active_tasks_count"],
                "completed_this_month": m["completed_this_month"],
                "avg_completion_days":  m["avg_completion_days"],
                "permissions":          permissions_for(m["role"]),
                "notifications":        notifications_for(m["is_team_lead"]),
                "notify_when":          notify_when_for(m["role"]),
                "created_at":           now,
                "updated_at":           now,
            }

            ref = db.collection("team_members").document()
            ref.set(payload)
            total_members += 1

            lead_tag = " ⭐ Team Lead" if m["is_team_lead"] else ""
            print(f"    • {member_code} — {m['name']} ({m['role']}){lead_tag}")

        print()

    # ── Crear assets ──────────────────────────────────────────────────────────
    print("🖥️   Creando assets...")

    for asset_data in ASSETS:
        team_key  = asset_data.pop("_team")
        team_id   = team_ids[team_key]
        team_name = "Red Team" if team_key == "red" else "Blue Team"
        now = utcnow()

        payload = {
            **asset_data,
            "team_id":   team_id,
            "team_name": team_name,
            "created_at": now,
            "updated_at": now,
        }

        ref = db.collection("assets").document()
        ref.set(payload)
        print(f"    • {asset_data['hostname']} ({asset_data['asset_type']}) → {team_name}")

    # ── Resumen ───────────────────────────────────────────────────────────────
    print()
    print("=" * 60)
    print(f"  ✅  Seed completado exitosamente")
    print(f"      Teams:   {len(TEAMS)}")
    print(f"      Members: {total_members}")
    print(f"      Assets:  {len(ASSETS)}")
    print("=" * 60)
    print()
    print("  Verifica en Firebase Console →")
    print("  https://console.firebase.google.com → Firestore Database")
    print()


if __name__ == "__main__":
    # Pasar --no-wipe para NO borrar datos previos
    should_wipe = "--no-wipe" not in sys.argv
    seed(wipe=should_wipe)