from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import json, random

app = FastAPI(title="TA Omniverse Hub API")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SAMPLE_PORTFOLIO = []

@app.get("/api/portfolio")
def get_portfolio():
    return {"items": SAMPLE_PORTFOLIO}

@app.get("/api/status")
def status():
    return {"server": "running", "items": len(SAMPLE_PORTFOLIO)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
