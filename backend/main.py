"""
Point d'entrée de l'application FastAPI - Urbex Map & Dashboard.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import Base, engine
from routers import spots, media, stats

# Initialisation des tables dans la base de données
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Urbex Map API",
    description="API pour la carte interactive d'exploration urbaine",
    version="1.0.0"
)

# Configuration CORS pour autoriser l'accès depuis Netlify et le local
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Inclusion des routes
app.include_router(spots.router)
app.include_router(media.router)
app.include_router(stats.router)


@app.get("/api/health")
def health():
    return {"status": "ok"}