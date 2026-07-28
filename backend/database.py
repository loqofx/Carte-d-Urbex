"""
Configuration de la base de données PostgreSQL (Supabase) via SQLAlchemy.
"""
import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

SQLALCHEMY_DATABASE_URL = os.getenv(
    "DATABASE_URL", 
    "postgresql://postgres:37tDZUWnZ/tjD_Y@db.tlmaephsbaivqtinxfrv.supabase.co:5432/postgres"
)

# pool_pre_ping=True vérifie la connexion avant chaque requête pour éviter les transactions mortes
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_pre_ping=True
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()  # Annule la transaction bloquée en cas d'erreur
        raise
    finally:
        db.close()