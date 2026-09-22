from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import asyncpg
from app.database import get_db
from app.schemas import (
    StudyPodCreate, StudyPodResponse, PodMatchRequest, PodMatchResult
)
from app.ai_engine import match_pods

router = APIRouter(prefix="/pods", tags=["study-pods"])


@router.post("", response_model=StudyPodResponse, status_code=status.HTTP_201_CREATED)
async def create_pod(pod: StudyPodCreate, db=Depends(get_db)):
    """Create a new study pod."""
    query = """
        INSERT INTO study_pods (
            course_code, topic, strong_skills, needed_skills,
            building_location, max_capacity, current_count
        ) VALUES ($1, $2, $3, $4, $5, $6, 1)
        RETURNING id, created_at
    """
    
    row = await db.fetchrow(
        query,
        pod.course_code,
        pod.topic,
        pod.strong_skills,
        pod.needed_skills,
        pod.building_location,
        pod.max_capacity
    )
    
    return StudyPodResponse(
        id=str(row["id"]),
        course_code=pod.course_code,
        topic=pod.topic,
        strong_skills=pod.strong_skills,
        needed_skills=pod.needed_skills,
        building_location=pod.building_location,
        max_capacity=pod.max_capacity,
        current_count=1,
        created_at=row["created_at"]
    )


@router.get("", response_model=List[StudyPodResponse])
async def get_pods(
    course_code: str | None = None,
    db=Depends(get_db)
):
    """Get all study pods, optionally filtered by course."""
    if course_code:
        query = """
            SELECT id, course_code, topic, strong_skills, needed_skills,
                   building_location, max_capacity, current_count, created_at
            FROM study_pods
            WHERE course_code = $1
            ORDER BY created_at DESC
            LIMIT 50
        """
        rows = await db.fetch(query, course_code)
    else:
        query = """
            SELECT id, course_code, topic, strong_skills, needed_skills,
                   building_location, max_capacity, current_count, created_at
            FROM study_pods
            ORDER BY created_at DESC
            LIMIT 50
        """
        rows = await db.fetch(query)
    
    return [
        StudyPodResponse(
            id=str(row["id"]),
            course_code=row["course_code"],
            topic=row["topic"],
            strong_skills=row["strong_skills"],
            needed_skills=row["needed_skills"],
            building_location=row["building_location"],
            max_capacity=row["max_capacity"],
            current_count=row["current_count"],
            created_at=row["created_at"]
        )
        for row in rows
    ]


@router.post("/match", response_model=List[PodMatchResult])
async def match_study_pods(request: PodMatchRequest, db=Depends(get_db)):
    """Find matching study pods using AI-powered compatibility scoring."""
    # Fetch nearby pods (for MVP, get all pods for the course)
    query = """
        SELECT id, course_code, topic, strong_skills, needed_skills,
               building_location, max_capacity, current_count, created_at
        FROM study_pods
        WHERE course_code = $1
          AND current_count < max_capacity
        ORDER BY created_at DESC
        LIMIT 20
    """
    
    rows = await db.fetch(query, request.course_code)
    
    if not rows:
        return []
    
    pods = [
        {
            "id": str(row["id"]),
            "course_code": row["course_code"],
            "topic": row["topic"],
            "strong_skills": row["strong_skills"],
            "needed_skills": row["needed_skills"],
            "building_location": row["building_location"],
            "max_capacity": row["max_capacity"],
            "current_count": row["current_count"],
            "created_at": row["created_at"]
        }
        for row in rows
    ]
    
    # Get AI matches
    matches = await match_pods(
        request.user_skills,
        request.needed_skills,
        request.course_code,
        pods
    )
    
    # Build response with full pod data
    pod_map = {p["id"]: p for p in pods}
    results = []
    
    for match in matches:
        pod_data = pod_map.get(match["pod_id"])
        if pod_data:
            results.append(PodMatchResult(
                pod=StudyPodResponse(**pod_data),
                match_score=match["match_score"],
                matching_skills=match["matching_skills"],
                missing_skills=match["missing_skills"]
            ))
    
    return results


@router.post("/{pod_id}/join", response_model=StudyPodResponse)
async def join_pod(pod_id: str, db=Depends(get_db)):
    """Increment current_count when a user joins a pod."""
    query = """
        UPDATE study_pods
        SET current_count = current_count + 1
        WHERE id = $1 AND current_count < max_capacity
        RETURNING id, course_code, topic, strong_skills, needed_skills,
                  building_location, max_capacity, current_count, created_at
    """
    
    row = await db.fetchrow(query, pod_id)
    
    if not row:
        raise HTTPException(
            status_code=400,
            detail="Pod not found or at maximum capacity"
        )
    
    return StudyPodResponse(
        id=str(row["id"]),
        course_code=row["course_code"],
        topic=row["topic"],
        strong_skills=row["strong_skills"],
        needed_skills=row["needed_skills"],
        building_location=row["building_location"],
        max_capacity=row["max_capacity"],
        current_count=row["current_count"],
        created_at=row["created_at"]
    )