from fastapi import FastAPI

app = FastAPI(title="Runner Analysis Service")

@app.get("/")
def health_check():
    return {"status": "ok", "service": "analysis-service funcionando"}