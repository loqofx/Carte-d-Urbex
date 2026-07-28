"""
Endpoints pour l'upload et la suppression de photos.
"""
import os
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db

router = APIRouter(prefix="/api", tags=["media"])

MEDIA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "media")
ALLOWED_EXT = {".jpg", ".jpeg", ".png", ".webp", ".gif"}


@router.post("/spots/{spot_id}/photos", response_model=List[schemas.PhotoOut], status_code=201)
async def upload_photos(spot_id: int, files: List[UploadFile] = File(...), db: Session = Depends(get_db)):
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot introuvable")

    os.makedirs(MEDIA_DIR, exist_ok=True)
    has_cover = db.query(models.Photo).filter(
        models.Photo.spot_id == spot_id, models.Photo.is_cover.is_(True)
    ).first() is not None

    created = []
    for f in files:
        ext = os.path.splitext(f.filename)[1].lower()
        if ext not in ALLOWED_EXT:
            continue
        fname = f"{uuid.uuid4().hex}{ext}"
        dest = os.path.join(MEDIA_DIR, fname)
        with open(dest, "wb") as out:
            out.write(await f.read())
        photo = models.Photo(spot_id=spot_id, filename=fname, is_cover=not has_cover)
        has_cover = True
        db.add(photo)
        created.append(photo)

    db.commit()
    for p in created:
        db.refresh(p)
    return created


@router.delete("/photos/{photo_id}", status_code=204)
def delete_photo(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo introuvable")
    path = os.path.join(MEDIA_DIR, photo.filename)
    if os.path.exists(path):
        os.remove(path)
    db.delete(photo)
    db.commit()
    return None


@router.put("/photos/{photo_id}/cover", status_code=200)
def set_cover(photo_id: int, db: Session = Depends(get_db)):
    photo = db.query(models.Photo).filter(models.Photo.id == photo_id).first()
    if not photo:
        raise HTTPException(status_code=404, detail="Photo introuvable")
    db.query(models.Photo).filter(models.Photo.spot_id == photo.spot_id).update({"is_cover": False})
    photo.is_cover = True
    db.commit()
    return {"ok": True}
