from fastapi import FastAPI

from api_gateway.app.api.routes import objetivos
from api_gateway.app.api.routes import sesiones

app = FastAPI(
    title="Dani-ETH API"
)

app.include_router(objetivos.router)
app.include_router(sesiones.router)

@app.get("/")
def root():
    return {"message": "Dani-ETH funcionando"}