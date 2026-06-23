from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api_gateway.app.api.routes import objetivos
from api_gateway.app.api.routes import sesiones
from api_gateway.app.api.routes import proxy

app = FastAPI(
    title="Dani-ETH API"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(objetivos.router)
app.include_router(sesiones.router)
app.include_router(proxy.router)

@app.get("/")
def root():
    return {"message": "Dani-ETH funcionando"}