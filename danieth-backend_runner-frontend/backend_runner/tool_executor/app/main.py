from fastapi import FastAPI
from tool_executor.app.api.routes.ejecutar import router as ejecutar_router

app = FastAPI(title="Tool Executor API")

app.include_router(ejecutar_router)


@app.get("/")
async def root():
    return {"message": "Tool Executor API"}
