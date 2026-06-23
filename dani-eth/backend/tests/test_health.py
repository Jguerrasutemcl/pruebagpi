"""
Tests básicos del endpoint de health.
Sirven como ejemplo de cómo escribir tests con FastAPI + pytest.
"""
from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_root_endpoint():
    """El endpoint raíz responde con un mensaje de bienvenida."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "message" in data
    assert "docs" in data


def test_health_endpoint():
    """El endpoint de health devuelve el estado del servicio."""
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert "firebase" in data
    assert data["firebase"] in ("connected", "not_configured")
