"""
Inicialización de Firebase Admin SDK.
Expone Auth para validar tokens JWT y escribir custom claims,
y Firestore para datos propios (usuarios, targets, reportes, settings).
Los PDFs de reportes se manejan con Supabase (no Firebase Storage).
"""
import logging
from pathlib import Path

import firebase_admin
from firebase_admin import credentials, auth, firestore

from app.core.config import settings

logger = logging.getLogger(__name__)

_firebase_app: firebase_admin.App | None = None
_firestore_client = None


def initialize_firebase() -> bool:
    global _firebase_app, _firestore_client

    if _firebase_app is not None:
        return True

    cred_path = Path(settings.firebase_credentials_path)
    if not cred_path.exists():
        logger.warning(
            f"Credenciales no encontradas en {cred_path.absolute()}. "
            "Firebase no estará disponible."
        )
        return False

    try:
        cred = credentials.Certificate(str(cred_path))
        _firebase_app = firebase_admin.initialize_app(
            cred, {"projectId": settings.firebase_project_id}
        )
        _firestore_client = firestore.client()
        logger.info(f"Firebase inicializado para proyecto: {settings.firebase_project_id}")
        return True
    except Exception as e:
        logger.error(f"Error inicializando Firebase: {e}")
        return False


def is_firebase_ready() -> bool:
    return _firebase_app is not None


def get_firestore():
    if _firestore_client is None:
        raise RuntimeError(
            "Firestore no disponible. Verificar que firebase-admin-key.json exista."
        )
    return _firestore_client


def get_auth():
    if _firebase_app is None:
        raise RuntimeError("Firebase Auth no disponible.")
    return auth