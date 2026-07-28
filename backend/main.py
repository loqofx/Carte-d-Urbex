"""
Point d'entrée de l'application FastAPI - Urbex Map & Dashboard.
Lancer avec : uvicorn main:app --reload --port 8000
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from database import Base, engine
from routers import spots, media, stats

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Urbex Map API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MEDIA_DIR = os.path.join(os.path.dirname(__file__), "media")
os.makedirs(MEDIA_DIR, exist_ok=True)
app.mount("/media", StaticFiles(directory=MEDIA_DIR), name="media")

app.include_router(spots.router)
app.include_router(media.router)
app.include_router(stats.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}
