"""
Endpoints CRUD pour les spots + filtres dynamiques.
"""
from datetime import date
from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

import models
import schemas
from database import get_db

router = APIRouter(prefix="/api/spots", tags=["spots"])


def _query_with_relations(db: Session):
    return db.query(models.Spot).options(
        joinedload(models.Spot.visits),
        joinedload(models.Spot.photos)
    )


@router.get("", response_model=List[schemas.SpotOut])
def list_spots(
    category: Optional[str] = None,
    status_filter: Optional[str] = None,
    year: Optional[str] = None,
    min_rating: Optional[float] = None,
    db: Session = Depends(get_db),
):
    try:
        db.rollback()

        q = _query_with_relations(db)
        
        if category:
            q = q.filter(models.Spot.category == category)
        if status_filter:
            q = q.filter(models.Spot.status == status_filter)
        if year:
            q = q.join(models.Spot.visits).filter(models.Visit.visit_date.like(f"{year}%"))
            
        spots = q.distinct().all()
        
        for spot in spots:
            if spot.warnings and isinstance(spot.warnings, list):
                cleaned_warnings = []
                for w in spot.warnings:
                    if isinstance(w, dict):
                        cleaned_warnings.append(w)
                    elif hasattr(w, "model_dump"):
                        cleaned_warnings.append(w.model_dump())
                spot.warnings = cleaned_warnings
            elif not isinstance(spot.warnings, list):
                spot.warnings = []

        if min_rating is not None:
            spots = [s for s in spots if (s.rating_global or 0) >= min_rating]
            
        return spots
    except Exception as e:
        db.rollback()
        print(f"Erreur SQL/Serialization list_spots: {str(e)}")
        raw_spots = db.query(models.Spot).all()
        for s in raw_spots:
            if not isinstance(s.warnings, list):
                s.warnings = []
        return raw_spots


@router.get("/meta/categories", response_model=List[str])
def list_categories(db: Session = Depends(get_db)):
    db.rollback()
    rows = db.query(models.Spot.category).distinct().all()
    return sorted({r[0] for r in rows if r[0]})


@router.get("/meta/years", response_model=List[str])
def list_years(db: Session = Depends(get_db)):
    db.rollback()
    rows = db.query(models.Visit.visit_date).all()
    years = sorted({r[0][:4] for r in rows if r[0]}, reverse=True)
    return years


@router.get("/{spot_id}", response_model=schemas.SpotOut)
def get_spot(spot_id: int, db: Session = Depends(get_db)):
    db.rollback()
    spot = _query_with_relations(db).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot introuvable")
    
    if spot.warnings and isinstance(spot.warnings, list):
        spot.warnings = [w if isinstance(w, dict) else w.model_dump() for w in spot.warnings if isinstance(w, (dict, object))]
    else:
        spot.warnings = []
        
    return spot


@router.post("", response_model=schemas.SpotOut, status_code=201)
def create_spot(payload: schemas.SpotCreate, db: Session = Depends(get_db)):
    db.rollback()
    data = payload.model_dump(exclude={"visit_dates"})
    
    if "warnings" in data and data["warnings"]:
        data["warnings"] = [w.model_dump() if hasattr(w, "model_dump") else w for w in data["warnings"]]
    else:
        data["warnings"] = []

    spot = models.Spot(**data)
    db.add(spot)
    db.flush()

    dates_to_add = payload.visit_dates
    if not dates_to_add:
        dates_to_add = [schemas.VisitIn(visit_date=date.today().isoformat(), was_arrested=False)]

    for d in dates_to_add:
        if isinstance(d, str):
            db.add(models.Visit(spot_id=spot.id, visit_date=d, was_arrested=False))
        elif hasattr(d, "visit_date"):
            db.add(models.Visit(spot_id=spot.id, visit_date=d.visit_date, was_arrested=d.was_arrested))
        elif isinstance(d, dict):
            db.add(models.Visit(spot_id=spot.id, visit_date=d.get("visit_date"), was_arrested=d.get("was_arrested", False)))

    db.commit()
    return get_spot(spot.id, db)


@router.put("/{spot_id}", response_model=schemas.SpotOut)
def update_spot(spot_id: int, payload: schemas.SpotUpdate, db: Session = Depends(get_db)):
    db.rollback()
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot introuvable")
    
    update_data = payload.model_dump(exclude_unset=True)
    if "warnings" in update_data and update_data["warnings"] is not None:
        update_data["warnings"] = [
            w.model_dump() if hasattr(w, "model_dump") else w for w in update_data["warnings"]
        ]

    for key, value in update_data.items():
        setattr(spot, key, value)
        
    db.commit()
    return get_spot(spot.id, db)


@router.delete("/{spot_id}", status_code=204)
def delete_spot(spot_id: int, db: Session = Depends(get_db)):
    db.rollback()
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot introuvable")
    db.delete(spot)
    db.commit()
    return None


@router.post("/{spot_id}/visits", response_model=schemas.VisitOut, status_code=201)
def add_visit(spot_id: int, payload: schemas.VisitIn, db: Session = Depends(get_db)):
    db.rollback()
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot introuvable")
    visit = models.Visit(spot_id=spot_id, visit_date=payload.visit_date, was_arrested=payload.was_arrested)
    db.add(visit)
    db.commit()
    db.refresh(visit)
    return visit


@router.delete("/{spot_id}/visits/{visit_id}", status_code=204)
def delete_visit(spot_id: int, visit_id: int, db: Session = Depends(get_db)):
    db.rollback()
    visit = db.query(models.Visit).filter(
        models.Visit.id == visit_id, models.Visit.spot_id == spot_id
    ).first()
    if not visit:
        raise HTTPException(status_code=404, detail="Visite introuvable")
    db.delete(visit)
    db.commit()
    return None