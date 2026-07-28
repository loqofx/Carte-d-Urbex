"""
Endpoints CRUD pour les spots + filtres dynamiques.
"""
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func

import models
import schemas
from database import get_db

router = APIRouter(prefix="/api/spots", tags=["spots"])


def _query_with_relations(db: Session):
    return db.query(models.Spot).options(
        joinedload(models.Spot.visits), joinedload(models.Spot.photos)
    )


@router.get("", response_model=List[schemas.SpotOut])
def list_spots(
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    year: Optional[str] = None,
    min_rating: Optional[float] = None,
    db: Session = Depends(get_db),
):
    q = _query_with_relations(db)
    if category:
        q = q.filter(models.Spot.category == category)
    if status_filter:
        q = q.filter(models.Spot.status == status_filter)
    if year:
        q = q.join(models.Visit).filter(models.Visit.visit_date.like(f"{year}%"))
    spots = q.distinct().all()
    if min_rating is not None:
        spots = [s for s in spots if s.rating_global >= min_rating]
    return spots


@router.get("/{spot_id}", response_model=schemas.SpotOut)
def get_spot(spot_id: int, db: Session = Depends(get_db)):
    spot = _query_with_relations(db).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot introuvable")
    return spot


@router.post("", response_model=schemas.SpotOut, status_code=201)
def create_spot(payload: schemas.SpotCreate, db: Session = Depends(get_db)):
    data = payload.model_dump(exclude={"visit_dates"})
    data["warnings"] = [w for w in data["warnings"]]
    spot = models.Spot(**data)
    db.add(spot)
    db.flush()  # pour obtenir spot.id

    for d in payload.visit_dates:
        db.add(models.Visit(spot_id=spot.id, visit_date=d))

    db.commit()
    db.refresh(spot)
    return spot


@router.put("/{spot_id}", response_model=schemas.SpotOut)
def update_spot(spot_id: int, payload: schemas.SpotUpdate, db: Session = Depends(get_db)):
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot introuvable")
    update_data = payload.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(spot, key, value)
    db.commit()
    db.refresh(spot)
    return spot


@router.delete("/{spot_id}", status_code=204)
def delete_spot(spot_id: int, db: Session = Depends(get_db)):
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot introuvable")
    db.delete(spot)
    db.commit()
    return None


@router.post("/{spot_id}/visits", response_model=schemas.VisitOut, status_code=201)
def add_visit(spot_id: int, payload: schemas.VisitIn, db: Session = Depends(get_db)):
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot introuvable")
    visit = models.Visit(spot_id=spot_id, visit_date=payload.visit_date)
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit


@router.delete("/{spot_id}/visits/{visit_id}", status_code=204)
def delete_visit(spot_id: int, visit_id: int, db: Session = Depends(get_db)):
    visit = db.query(models.Visit).filter(
        models.Visit.id == visit_id, models.Visit.spot_id == spot_id
    ).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visite introuvable")
    db.delete(visit)
    db.commit()
    return None


@router.get("/meta/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    rows = db.query(models.Spot.category).distinct().all()
    return sorted({r[0] for r in rows})


@router.get("/meta/years", response_model=List[str])
def list_years(db: Session = Depends(get_db)):
    rows = db.query(models.Visit.visit_date).all()
    years = sorted({r[0][:4] for r in rows if r[0]}, reverse=True)
    return years
