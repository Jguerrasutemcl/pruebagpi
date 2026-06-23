from fastapi import FastAPI
from tool_registry.app.api.routes.herramientas import router as herramientas_router
from tool_registry.app.api.routes.versiones import router as versiones_router

app = FastAPI(title="Tool Registry API")

app.include_router(herramientas_router)
app.include_router(versiones_router)


@app.get("/")
async def root():
    return {"message": "Tool Registry API"}
