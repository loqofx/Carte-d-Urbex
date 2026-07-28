"""
Configuration de la base de données PostgreSQL (Supabase) via SQLAlchemy.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

# Récupération de l'URL depuis l'environnement ou utilisation directe de ton URL Supabase
# ATTENTION : On a bien retiré les crochets [ et ] autour du mot de passe !
SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:37tDZUWnZ/tjD_Y@db.tlmaephsbaivqtinxfrv.supabase.co:5432/postgres"
)

# On retire connect_args car il est spécifique à SQLite
engine = create_engine(
    SQLALCHEMY_DATABASE_URL
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()