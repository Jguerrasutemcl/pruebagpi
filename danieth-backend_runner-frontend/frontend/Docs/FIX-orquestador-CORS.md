# Fix necesario en el Orquestador — CORS

## Qué falla

La página de Reportes del frontend llama a `GET /campaign/reports`. **El orquestador
responde 200 OK** (se ve en sus propios logs), pero el navegador **descarta la
respuesta** y el frontend muestra "No se pudieron cargar los reportes".

```
INFO: 127.0.0.1 - "GET /campaign/reports HTTP/1.1" 200 OK   ← el servidor responde bien
```

El problema NO está en el frontend: el código hace la petición correctamente y solo
entra en su rama de error cuando la promesa de la petición es **rechazada por el
navegador**. Un 200 del servidor solo se rechaza en el navegador cuando falla **CORS**.

## Por qué pasa (CORS)

- El frontend corre en **`http://localhost:5173`**.
- El orquestador corre en **`http://localhost:8002`** (`VITE_API_URL` del frontend).
- Puerto distinto = **origen distinto** ⇒ el navegador aplica la política CORS.
- El frontend manda el header `Authorization: Bearer <token Firebase>` en cada
  request. Eso convierte la petición en **"no simple"**, así que el navegador hace
  primero un **preflight `OPTIONS`** y exige que la respuesta incluya las cabeceras
  CORS correctas, incluyendo permitir el header `Authorization`.
- Si el orquestador **no devuelve** `Access-Control-Allow-Origin` (ni maneja el
  preflight `OPTIONS`), el navegador bloquea la respuesta aunque el GET devuelva 200.

## Qué hay que modificar en el orquestador

Añadir el middleware CORS de FastAPI/Starlette en el arranque de la app
(`main.py` del orquestador), **antes** de incluir los routers:

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Dani-ETH Orchestrator")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # origen del frontend en desarrollo
    allow_methods=["*"],                      # GET, POST, OPTIONS, etc.
    allow_headers=["*"],                      # imprescindible para 'Authorization'
    # allow_credentials=True,  # NO usar junto con allow_origins=["*"] (es inválido)
)

# ... app.include_router(...) etc.
```

### Notas importantes

1. **`allow_headers=["*"]` es clave**: sin él, el preflight rechaza el header
   `Authorization` que envía Firebase y la petición real nunca se completa en el
   navegador.

2. **Manejo del preflight `OPTIONS`**: el `CORSMiddleware` de Starlette responde
   automáticamente a las peticiones `OPTIONS`. No hay que crear endpoints `OPTIONS`
   manuales.

3. **No combinar `allow_origins=["*"]` con `allow_credentials=True`** — esa
   combinación es inválida según la spec de CORS y el navegador la rechaza. Si se
   necesitan cookies/credenciales, hay que listar el origen explícito
   (`["http://localhost:5173"]`) y entonces sí `allow_credentials=True`.
   En nuestro caso usamos token Bearer (no cookies), así que **no** hace falta
   `allow_credentials`.

4. **Para producción**: añadir el dominio real del frontend a `allow_origins`
   (ej. `["http://localhost:5173", "https://app.dani-eth.com"]`).

## Detalle secundario (no bloqueante): redirect 307 por slash final

En los logs aparece también:

```
INFO: "GET /campaign/reports/ HTTP/1.1" 307 Temporary Redirect
```

Esa petición lleva **slash final** (`/reports/`) y el orquestador la redirige a la
versión sin slash. El frontend pide **sin** slash, así que obtiene el 200 directo y
ese 307 no es de nuestra llamada. **No es la causa del fallo**, pero conviene saber
que existe: un 307 cross-origin sin cabeceras CORS también rompería la petición, así
que con el `CORSMiddleware` puesto queda cubierto de todos modos.

## Cómo verificar que quedó arreglado

1. Reiniciar el orquestador con el middleware CORS añadido.
2. En el frontend, recargar `/reports`.
3. En DevTools → Network, la petición `campaign/reports` debe aparecer con la
   cabecera de respuesta `Access-Control-Allow-Origin: http://localhost:5173`.
4. La lista de reportes (o el estado vacío) debe renderizarse sin la tarjeta de error.
