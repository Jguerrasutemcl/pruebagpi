import time
import requests

TOOL_REGISTRY_URL = "http://tool_registry:8003"

HERRAMIENTAS = [
    {
        "nombre": "nmap",
        "nombre_UI": "Nmap",
        "descripcion": "Escáner de puertos y detección de servicios",
        "categoria": "reconocimiento",
        "casos_usos": ["descubrir puertos abiertos", "detectar servicios y versiones", "reconocimiento de red"],
        "version_inicial": "1.0.0",
        "docker_imagen": "backend_runner-nmap",
        "esquema_input": {
            "objetivo": {"type": "string", "required": True, "description": "IP o hostname objetivo"},
            "tipo_escaneo": {"type": "string", "required": False, "default": "-sV", "description": "Tipo de escaneo nmap"},
            "velocidad": {"type": "integer", "required": False, "default": 3, "description": "Velocidad T0-T5"},
            "puertos": {"type": "string", "required": False, "default": "", "description": "Puertos a escanear ej: 80,443 o 1-1000"}
        },
        "esquema_output": {
            "objetivo": {"type": "string"},
            "resultado": {
                "hosts": {"type": "array"},
                "resumen": {"type": "object"}
            },
            "codigo_salida": {"type": "integer"},
            "error": {"type": "string"}
        }
    },
    {
        "nombre": "sqlmap",
        "nombre_UI": "SQLMap",
        "descripcion": "Detección y explotación de inyecciones SQL",
        "categoria": "vulnerabilidades",
        "casos_usos": ["detectar SQL injection", "extraer datos de bases de datos", "fingerprinting de DBMS"],
        "version_inicial": "1.0.0",
        "docker_imagen": "backend_runner-sqlmap",
        "esquema_input": {
            "url": {"type": "string", "required": True, "description": "URL objetivo"},
            "parametro": {"type": "string", "required": False, "default": "", "description": "Parámetro a testear"},
            "nivel": {"type": "integer", "required": False, "default": 1, "description": "Nivel de tests 1-5"},
            "riesgo": {"type": "integer", "required": False, "default": 1, "description": "Riesgo 1-3"},
            "data": {"type": "string", "required": False, "default": "", "description": "POST body"},
            "forms": {"type": "boolean", "required": False, "default": False},
            "crawl": {"type": "integer", "required": False, "default": 0},
            "dbms": {"type": "string", "required": False, "default": ""},
            "tecnica": {"type": "string", "required": False, "default": ""},
            "time_sec": {"type": "integer", "required": False, "default": 10},
            "cookies": {"type": "string", "required": False, "default": ""}
        },
        "esquema_output": {
            "url": {"type": "string"},
            "resultado": {
                "vulnerable": {"type": "boolean"},
                "inyecciones_detectadas": {"type": "array"},
                "raw_output": {"type": "string"}
            },
            "codigo_salida": {"type": "integer"},
            "error": {"type": "string"}
        }
    },
    {
        "nombre": "nuclei",
        "nombre_UI": "Nuclei",
        "descripcion": "Escáner de vulnerabilidades basado en templates",
        "categoria": "vulnerabilidades",
        "casos_usos": ["detectar CVEs", "escaneo de exposiciones", "detección de misconfiguraciones"],
        "version_inicial": "1.0.0",
        "docker_imagen": "backend_runner-nuclei",
        "esquema_input": {
            "objetivo": {"type": "string", "required": True, "description": "URL o IP objetivo"},
            "templates": {"type": "array", "required": False, "default": [], "description": "Templates a usar ej: ['cves/', 'exposures/']"},
            "severidad": {"type": "array", "required": False, "default": [], "description": "Filtrar por severidad: info, low, medium, high, critical"},
            "rate_limit": {"type": "integer", "required": False, "default": 150}
        },
        "esquema_output": {
            "objetivo": {"type": "string"},
            "resultado": {
                "vulnerabilidades": {"type": "array"},
                "resumen": {"type": "object"}
            },
            "codigo_salida": {"type": "integer"},
            "error": {"type": "string"}
        }
    },
    {
        "nombre": "xsstrike",
        "nombre_UI": "XSStrike",
        "descripcion": "Detección de vulnerabilidades XSS",
        "categoria": "vulnerabilidades",
        "casos_usos": ["detectar XSS reflejado", "detectar XSS en formularios", "crawl de parámetros XSS"],
        "version_inicial": "1.0.0",
        "docker_imagen": "backend_runner-xsstrike",
        "esquema_input": {
            "url": {"type": "string", "required": True, "description": "URL objetivo"},
            "parametro": {"type": "string", "required": False, "default": "", "description": "Parámetro específico a testear"},
            "crawl": {"type": "boolean", "required": False, "default": False, "description": "Hacer crawl del sitio"}
        },
        "esquema_output": {
            "url": {"type": "string"},
            "resultado": {
                "vulnerable": {"type": "boolean"},
                "hallazgos": {"type": "array"},
                "total_encontrados": {"type": "integer"}
            },
            "codigo_salida": {"type": "integer"},
            "error": {"type": "string"}
        }
    }
]


def esperar_registry(max_intentos=30, intervalo=3):
    print("Esperando que tool_registry esté listo...")
    for i in range(max_intentos):
        try:
            r = requests.get(f"{TOOL_REGISTRY_URL}/", timeout=3)
            if r.status_code == 200:
                print("tool_registry disponible.")
                return True
        except Exception:
            pass
        print(f"  intento {i + 1}/{max_intentos}...")
        time.sleep(intervalo)
    print("ERROR: tool_registry no respondió a tiempo.")
    return False


def registrar_herramienta(h):
    nombre = h["nombre"]
    try:
        r = requests.post(f"{TOOL_REGISTRY_URL}/herramientas/", json=h, timeout=10)
        if r.status_code in (200, 201):
            print(f"  [{nombre}] registrada OK")
        elif r.status_code == 409:
            print(f"  [{nombre}] ya existe, omitiendo")
        else:
            print(f"  [{nombre}] ERROR {r.status_code}: {r.text}")
    except Exception as e:
        print(f"  [{nombre}] ERROR: {e}")


def main():
    if not esperar_registry():
        exit(1)

    print("\nRegistrando herramientas...")
    for h in HERRAMIENTAS:
        registrar_herramienta(h)

    print("\nSeed completado.")


if __name__ == "__main__":
    main()
