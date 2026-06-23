import sys
import json
import subprocess


def main():
    params = json.loads(sys.argv[1])

    objetivo = params["objetivo"]
    templates = params.get("templates", [])
    severidad = params.get("severidad", [])
    rate_limit = params.get("rate_limit", 150)

    cmd = ["nuclei", "-u", objetivo, "-rate-limit", str(rate_limit), "-j", "-silent", "-timeout", "10", "-max-host-error", "3"]
    if templates:
        for t in templates:
            cmd.extend(["-t", t])
    if severidad:
        cmd.extend(["-severity", ",".join(severidad)])

    resultado = subprocess.run(cmd, capture_output=True, text=True, timeout=800)

    vulnerabilidades = []
    for linea in resultado.stdout.strip().splitlines():
        try:
            v = json.loads(linea)
            vulnerabilidades.append({
                "template_id": v.get("template-id", ""),
                "nombre": v.get("info", {}).get("name", ""),
                "severidad": v.get("info", {}).get("severity", ""),
                "url_afectada": v.get("matched-at", ""),
                "descripcion": v.get("info", {}).get("description", ""),
                "referencia": v.get("info", {}).get("reference", [])
            })
        except Exception:
            pass

    resumen = {"info": 0, "low": 0, "medium": 0, "high": 0, "critical": 0}
    for v in vulnerabilidades:
        sev = v.get("severidad", "").lower()
        if sev in resumen:
            resumen[sev] += 1

    error_msg = None
    if resultado.returncode != 0 or (not vulnerabilidades and resultado.stderr.strip()):
        error_msg = resultado.stderr.strip() or resultado.stdout.strip() or "nuclei exit code " + str(resultado.returncode)

    output = {
        "objetivo": objetivo,
        "resultado": {
            "vulnerabilidades": vulnerabilidades,
            "resumen": {**resumen, "total": len(vulnerabilidades)}
        },
        "codigo_salida": resultado.returncode,
        "error": error_msg
    }

    print(json.dumps(output))


if __name__ == "__main__":
    main()
