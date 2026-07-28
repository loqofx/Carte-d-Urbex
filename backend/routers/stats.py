"""
Endpoint pour les statistiques globales.
"""
from collections import Counter
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/api/stats", tags=["stats"])


@router.get("", response_model=schemas.StatsOut)
def get_stats(db: Session = Depends(get_db)):
    spots = db.query(models.Spot).all()
    visits = db.query(models.Visit).all()

    by_category = Counter(s.category for s in spots)
    by_status = Counter(s.status for s in spots)
    visits_by_year = Counter(v.visit_date[:4] for v in visits if v.visit_date)

    most_active_year = None
    if visits_by_year:
        most_active_year = max(visits_by_year.items(), key=lambda kv: kv[1])[0]

    return schemas.StatsOut(
        total_spots=len(spots),
        by_category=dict(by_category),
        by_status=dict(by_status),
        most_active_year=most_active_year,
        visits_by_year=dict(visits_by_year),
    )
