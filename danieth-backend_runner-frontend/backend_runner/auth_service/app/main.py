from fastapi import FastAPI

app = FastAPI(title="Runner Auth Service")

@app.get("/")
def health_check():
    return {"status": "ok", "service": "auth-service funcionando"}