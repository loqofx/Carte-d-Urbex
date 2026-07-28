"""
Modèles SQLAlchemy : Spot, Visit, Photo.
"""
from sqlalchemy import (
    Column, Integer, String, Float, Text, ForeignKey, DateTime, JSON, Boolean
)
from sqlalchemy.orm import relationship
from datetime import datetime, timezone

from database import Base


class Spot(Base):
    __tablename__ = "spots"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False, index=True)  # chateau, usine, hopital, souterrain, zoo, autre...
    emoji = Column(String, nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="intact")  # intact, degrade, incendie, demoli, rachete_renove

    rating_state = Column(Integer, default=0)      # 0-10
    rating_safety = Column(Integer, default=0)      # 0-10
    rating_interest = Column(Integer, default=0)    # 0-10

    notes = Column(Text, nullable=True)             # journal d'anecdotes
    warnings = Column(JSON, default=list)           # [{"type": "masque", "level": "rouge"}, ...]

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    visits = relationship("Visit", back_populates="spot", cascade="all, delete-orphan", order_by="desc(Visit.visit_date)")
    photos = relationship("Photo", back_populates="spot", cascade="all, delete-orphan")

    @property
    def rating_global(self):
        vals = [v for v in (self.rating_state, self.rating_safety, self.rating_interest) if v is not None]
        if not vals:
            return 0
        return round(sum(vals) / len(vals), 1)


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False)
    visit_date = Column(String, nullable=False)  # format YYYY-MM-DD, stocké en string pour simplicité

    spot = relationship("Spot", back_populates="visits")


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False)
    filename = Column(String, nullable=False)
    is_cover = Column(Boolean, default=False)

    spot = relationship("Spot", back_populates="photos")
