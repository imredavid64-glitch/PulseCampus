from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import asyncpg
from app.database import get_db, get_supabase
from app.schemas import (
    PulseCreate, PulseResponse, NearbyPulsesRequest, 
    AIParseResponse, PulseCategory, UrgencyLevel
)
from app.ai_engine import parse_pulse
from datetime import datetime

router = APIRouter(prefix="/pulses", tags=["pulses"])


@router.post("", response_model=PulseResponse, status_code=status.HTTP_201_CREATED)
async def create_pulse(pulse: PulseCreate, db=Depends(get_db)):
    """Create a new pulse: parse with Gemini, store in Supabase with PostGIS point."""
    # Parse with Gemini AI
    parsed: AIParseResponse = await parse_pulse(pulse.raw_text, pulse.location_name)
    
    # Block unsafe content
    if not parsed.is_safe:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Content flagged as unsafe: {parsed.safety_reason}"
        )
    
    # Insert into database with PostGIS point
    query = """
        INSERT INTO pulses (
            raw_text, summary, category, urgency, item_or_action,
            location_name, location, expiration_minutes, is_safe, safety_reason
        ) VALUES ($1, $2, $3, $4, $5, $6, ST_SetSRID(ST_MakePoint($7, $8), 4326), $9, $10, $11)
        RETURNING id, created_at, expires_at
    """
    
    row = await db.fetchrow(
        query,
        pulse.raw_text,
        parsed.summary,
        parsed.category.value,
        parsed.urgency.value,
        parsed.item_or_action_needed,
        pulse.location_name,
        pulse.lng,  # ST_MakePoint takes (x, y) = (lng, lat)
        pulse.lat,
        parsed.expiration_minutes,
        parsed.is_safe,
        parsed.safety_reason
    )
    
    return PulseResponse(
        id=str(row["id"]),
        raw_text=pulse.raw_text,
        summary=parsed.summary,
        category=parsed.category,
        urgency=parsed.urgency,
        item_or_action=parsed.item_or_action_needed,
        location_name=pulse.location_name,
        lat=pulse.lat,
        lng=pulse.lng,
        expiration_minutes=parsed.expiration_minutes,
        is_safe=parsed.is_safe,
        safety_reason=parsed.safety_reason,
        created_at=row["created_at"],
        expires_at=row["expires_at"]
    )


@router.get("/nearby", response_model=List[PulseResponse])
async def get_nearby_pulses(
    lat: float,
    lng: float,
    radius_meters: int = 1000,
    db=Depends(get_db)
):
    """Get active, safe pulses within radius using PostGIS ST_DWithin."""
    query = """
        SELECT 
            id, raw_text, summary, category, urgency, item_or_action,
            location_name,
            ST_Y(location::geometry) as lat,
            ST_X(location::geometry) as lng,
            expiration_minutes, is_safe, safety_reason,
            created_at, expires_at
        FROM pulses
        WHERE expires_at > NOW()
          AND is_safe = TRUE
          AND ST_DWithin(
              location,
              ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
              $3
          )
        ORDER BY 
            CASE urgency 
                WHEN 'Critical' THEN 1 
                WHEN 'High' THEN 2 
                WHEN 'Medium' THEN 3 
                WHEN 'Low' THEN 4 
            END,
            ST_Distance(
                location,
                ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography
            ),
            created_at DESC
        LIMIT 50
    """
    
    rows = await db.fetch(query, lng, lat, radius_meters)
    
    return [
        PulseResponse(
            id=str(row["id"]),
            raw_text=row["raw_text"],
            summary=row["summary"],
            category=PulseCategory(row["category"]),
            urgency=UrgencyLevel(row["urgency"]),
            item_or_action=row["item_or_action"],
            location_name=row["location_name"],
            lat=row["lat"],
            lng=row["lng"],
            expiration_minutes=row["expiration_minutes"],
            is_safe=row["is_safe"],
            safety_reason=row["safety_reason"],
            created_at=row["created_at"],
            expires_at=row["expires_at"]
        )
        for row in rows
    ]


@router.get("/{pulse_id}", response_model=PulseResponse)
async def get_pulse(pulse_id: str, db=Depends(get_db)):
    """Get a single pulse by ID."""
    query = """
        SELECT 
            id, raw_text, summary, category, urgency, item_or_action,
            location_name,
            ST_Y(location::geometry) as lat,
            ST_X(location::geometry) as lng,
            expiration_minutes, is_safe, safety_reason,
            created_at, expires_at
        FROM pulses
        WHERE id = $1
    """
    
    row = await db.fetchrow(query, pulse_id)
    
    if not row:
        raise HTTPException(status_code=404, detail="Pulse not found")
    
    return PulseResponse(
        id=str(row["id"]),
        raw_text=row["raw_text"],
        summary=row["summary"],
        category=PulseCategory(row["category"]),
        urgency=UrgencyLevel(row["urgency"]),
        item_or_action=row["item_or_action"],
        location_name=row["location_name"],
        lat=row["lat"],
        lng=row["lng"],
        expiration_minutes=row["expiration_minutes"],
        is_safe=row["is_safe"],
        safety_reason=row["safety_reason"],
        created_at=row["created_at"],
        expires_at=row["expires_at"]
    )