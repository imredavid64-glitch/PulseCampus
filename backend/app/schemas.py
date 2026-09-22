from pydantic import BaseModel, Field, field_validator
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PulseCategory(str, Enum):
    ACADEMIC = "Academic"
    BORROW_GEAR = "BorrowGear"
    FOOD_SHARING = "FoodSharing"
    SAFETY_ESCORT = "SafetyEscort"
    GENERAL_HELP = "GeneralHelp"


class UrgencyLevel(str, Enum):
    LOW = "Low"
    MEDIUM = "Medium"
    HIGH = "High"
    CRITICAL = "Critical"


class AIParseResponse(BaseModel):
    category: PulseCategory
    summary: str = Field(..., max_length=100)
    urgency: UrgencyLevel
    item_or_action_needed: Optional[str] = Field(None, max_length=100)
    expiration_minutes: int = Field(..., ge=15, le=360)
    is_safe: bool = True
    safety_reason: Optional[str] = None


class PulseCreate(BaseModel):
    raw_text: str = Field(..., min_length=1, max_length=2000)
    location_name: str = Field(..., min_length=1, max_length=100)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)


class PulseResponse(BaseModel):
    id: str
    raw_text: str
    summary: str
    category: PulseCategory
    urgency: UrgencyLevel
    item_or_action: Optional[str]
    location_name: str
    lat: float
    lng: float
    expiration_minutes: int
    is_safe: bool
    safety_reason: Optional[str]
    created_at: datetime
    expires_at: datetime

    class Config:
        from_attributes = True


class NearbyPulsesRequest(BaseModel):
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    radius_meters: int = Field(1000, ge=100, le=5000)


class StudyPodCreate(BaseModel):
    course_code: str = Field(..., min_length=1, max_length=20)
    topic: str = Field(..., min_length=1, max_length=100)
    strong_skills: List[str] = Field(default_factory=list)
    needed_skills: List[str] = Field(default_factory=list)
    building_location: str = Field(..., min_length=1, max_length=100)
    max_capacity: int = Field(4, ge=2, le=8)


class StudyPodResponse(BaseModel):
    id: str
    course_code: str
    topic: str
    strong_skills: List[str]
    needed_skills: List[str]
    building_location: str
    max_capacity: int
    current_count: int
    created_at: datetime

    class Config:
        from_attributes = True


class PodMatchRequest(BaseModel):
    course_code: str = Field(..., min_length=1, max_length=20)
    user_skills: List[str] = Field(default_factory=list)
    needed_skills: List[str] = Field(default_factory=list)
    lat: float = Field(..., ge=-90, le=90)
    lng: float = Field(..., ge=-180, le=180)
    radius_meters: int = Field(1000, ge=100, le=5000)


class PodMatchResult(BaseModel):
    pod: StudyPodResponse
    match_score: float = Field(..., ge=0, le=1)
    matching_skills: List[str]
    missing_skills: List[str]


class HealthResponse(BaseModel):
    status: str
    timestamp: datetime
    version: str = "1.0.0"