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
    category = Column(String, nullable=False, index=True)
    emoji = Column(String, nullable=True)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="intact")

    rating_state = Column(Integer, default=0)      # 0-10 (État)
    rating_safety = Column(Integer, default=0)     # 0-10 (Risque)
    rating_interest = Column(Integer, default=0)   # 0-10 (Intérêt)

    notes = Column(Text, nullable=True)
    warnings = Column(JSON, default=list)

    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))

    visits = relationship("Visit", back_populates="spot", cascade="all, delete-orphan", order_by="desc(Visit.visit_date)")
    photos = relationship("Photo", back_populates="spot", cascade="all, delete-orphan")

    @property
    def rating_global(self):
        interest = self.rating_interest if self.rating_interest is not None else 0
        state = self.rating_state if self.rating_state is not None else 0
        safety = self.rating_safety if self.rating_safety is not None else 0
        
        total_score = (interest * 3) + (state * 2) + ((10 - safety) * 1.5)
        return round(total_score / 6.5, 1)


class Visit(Base):
    __tablename__ = "visits"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False)
    visit_date = Column(String, nullable=False)  # format YYYY-MM-DD
    was_arrested = Column(Boolean, default=False)

    spot = relationship("Spot", back_populates="visits")


class Photo(Base):
    __tablename__ = "photos"

    id = Column(Integer, primary_key=True, index=True)
    spot_id = Column(Integer, ForeignKey("spots.id"), nullable=False)
    filename = Column(String, nullable=False)
    is_cover = Column(Boolean, default=False)

    spot = relationship("Spot", back_populates="photos")