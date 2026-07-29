"""
Schémas Pydantic pour la validation des données entrantes/sortantes.
"""
from typing import List, Optional, Union
from pydantic import BaseModel, ConfigDict


class WarningItem(BaseModel):
    type: str
    level: str


class PhotoOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    filename: str
    is_cover: bool


class VisitIn(BaseModel):
    visit_date: str
    was_arrested: bool = False


class VisitOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    visit_date: str
    was_arrested: bool = False


class SpotBase(BaseModel):
    name: str
    category: str
    emoji: Optional[str] = None
    lat: float
    lng: float
    status: str = "intact"
    rating_state: int = 0
    rating_safety: int = 0
    rating_interest: int = 0
    notes: Optional[str] = None
    warnings: List[WarningItem] = []


class SpotCreate(SpotBase):
    visit_dates: List[Union[VisitIn, str]] = []  # VisitIn est placé en premier pour prioriser le mode objet


class SpotUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    emoji: Optional[str] = None
    lat: Optional[float] = None
    lng: Optional[float] = None
    status: Optional[str] = None
    rating_state: Optional[int] = None
    rating_safety: Optional[int] = None
    rating_interest: Optional[int] = None
    notes: Optional[str] = None
    warnings: Optional[List[WarningItem]] = None


class SpotOut(SpotBase):
    model_config = ConfigDict(from_attributes=True)
    id: int
    rating_global: float
    visits: List[VisitOut] = []
    photos: List[PhotoOut] = []


class StatsOut(BaseModel):
    total_spots: int
    by_category: dict
    by_status: dict
    most_active_year: Optional[str] = None
    visits_by_year: dict