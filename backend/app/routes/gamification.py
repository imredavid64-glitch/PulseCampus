from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from app.gamification import gamification_service, GamificationService
from pydantic import BaseModel

router = APIRouter(prefix="/gamification", tags=["gamification"])


class BadgeResponse(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    tier: str
    earned_at: Optional[str] = None


class UserStatsResponse(BaseModel):
    user_id: str
    pulse_count: int
    help_count: int
    pod_joins: int
    created_pods: int
    streak: int
    badges: List[BadgeResponse]
    points: int
    level: int


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    points: int
    streak: int
    help_count: int
    level: int
    badges: List[BadgeResponse]


class BadgeAwardResponse(BaseModel):
    new_badges: List[BadgeResponse]


@router.get("/stats/{user_id}", response_model=UserStatsResponse)
async def get_user_stats(user_id: str):
    """Get user's gamification stats."""
    stats = await gamification_service.get_user_stats(user_id)
    return UserStatsResponse(**stats)


@router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def get_leaderboard(
    limit: int = Query(10, ge=1, le=100),
    category: str = Query('points', pattern='^(points|streak|helps)$')
):
    """Get leaderboard."""
    leaderboard = await gamification_service.get_leaderboard(limit, category)
    return [LeaderboardEntry(**entry) for entry in leaderboard]


@router.post("/check-badges/{user_id}", response_model=BadgeAwardResponse)
async def check_badges(
    user_id: str,
    action: str,
    metadata: dict = {}
):
    """Check and award badges for an action."""
    new_badges = await gamification_service.check_and_award_badges(user_id, action, metadata)
    return BadgeAwardResponse(new_badges=[BadgeResponse(**b) for b in new_badges])


@router.get("/badges", response_model=List[BadgeResponse])
async def get_all_badges():
    """Get all available badges."""
    from app.gamification import gamification_service
    badges = []
    for badge_id, badge_def in gamification_service.BADGES.items():
        badges.append(BadgeResponse(
            id=badge_id,
            name=badge_def['name'],
            description=badge_def['description'],
            icon=badge_def['icon'],
            tier=badge_def['tier'],
        ))
    return badges