import os
import uuid
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from sqlalchemy.orm import Session
from database import get_db
import models
from supabase import create_client, Client

router = APIRouter(prefix="/api/media", tags=["media"])

# Récupération des accès Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://TON-PROJET.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "TA-CLE-ANON-PUBLIC-SUPABASE")

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
BUCKET_NAME = "urbex-media"

@router.post("/upload/{spot_id}")
async def upload_photo(spot_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    spot = db.query(models.Spot).filter(models.Spot.id == spot_id).first()
    if not spot:
        raise HTTPException(status_code=404, detail="Spot non trouvé")

    file_ext = file.filename.split(".")[-1]
    unique_filename = f"spot_{spot_id}_{uuid.uuid4().hex}.{file_ext}"
    contents = await file.read()

    try:
        supabase.storage.from_(BUCKET_NAME).upload(
            path=unique_filename,
            file=contents,
            file_options={"content-type": file.content_type}
        )

        # Enregistrement du nom du fichier selon models.Photo (colonne 'filename')
        new_photo = models.Photo(spot_id=spot_id, filename=unique_filename)
        db.add(new_photo)
        db.commit()
        db.refresh(new_photo)

        return {
            "message": "Photo téléversée avec succès", 
            "filename": unique_filename, 
            "photo_id": new_photo.id
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Erreur lors de l'upload : {str(e)}")