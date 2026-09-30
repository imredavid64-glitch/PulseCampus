from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from typing import Optional, List
import asyncpg
from app.database import get_db
from app.push_service import push_service

router = APIRouter(prefix="/push", tags=["push-notifications"])


class PushSubscription(BaseModel):
    endpoint: str
    keys: dict


class PushSubscriptionCreate(BaseModel):
    subscription: PushSubscription
    user_agent: Optional[str] = None


class PushSubscriptionResponse(BaseModel):
    id: str
    endpoint: str
    created_at: str


class PushTestRequest(BaseModel):
    title: str = "Test Notification"
    body: str = "This is a test notification from PulseCampus"
    data: Optional[dict] = None


@router.post("/subscribe", response_model=PushSubscriptionResponse, status_code=status.HTTP_201_CREATED)
async def subscribe(subscription_data: PushSubscriptionCreate, db=Depends(get_db)):
    """Save a push subscription."""
    endpoint = subscription_data.subscription.endpoint
    keys = subscription_data.subscription.keys
    user_agent = subscription_data.user_agent
    
    # Check if subscription already exists
    existing = await db.fetchrow(
        "SELECT id FROM push_subscriptions WHERE endpoint = $1",
        endpoint
    )
    
    if existing:
        # Update existing subscription
        await db.execute(
            """
            UPDATE push_subscriptions 
            SET keys = $1, user_agent = $2, updated_at = NOW()
            WHERE endpoint = $3
            """,
            json.dumps(keys), user_agent, endpoint
        )
        row = await db.fetchrow(
            "SELECT id, endpoint, created_at FROM push_subscriptions WHERE endpoint = $1",
            endpoint
        )
    else:
        # Create new subscription
        row = await db.fetchrow(
            """
            INSERT INTO push_subscriptions (endpoint, keys, user_agent)
            VALUES ($1, $2, $3)
            RETURNING id, endpoint, created_at
            """,
            endpoint, json.dumps(keys), user_agent
        )
    
    return PushSubscriptionResponse(
        id=str(row["id"]),
        endpoint=row["endpoint"],
        created_at=row["created_at"].isoformat()
    )


@router.delete("/subscribe")
async def unsubscribe(endpoint: str, db=Depends(get_db)):
    """Remove a push subscription."""
    await db.execute(
        "DELETE FROM push_subscriptions WHERE endpoint = $1",
        endpoint
    )
    return {"message": "Subscription removed"}


@router.get("/subscriptions", response_model=List[PushSubscriptionResponse])
async def list_subscriptions(db=Depends(get_db)):
    """List all push subscriptions (admin only)."""
    rows = await db.fetch(
        "SELECT id, endpoint, created_at FROM push_subscriptions ORDER BY created_at DESC"
    )
    return [
        PushSubscriptionResponse(
            id=str(row["id"]),
            endpoint=row["endpoint"],
            created_at=row["created_at"].isoformat()
        )
        for row in rows
    ]


@router.post("/test")
async def test_push(request: PushTestRequest, db=Depends(get_db)):
    """Send a test push notification to all subscriptions."""
    rows = await db.fetch("SELECT endpoint, keys FROM push_subscriptions")
    
    results = []
    for row in rows:
        subscription = {"endpoint": row["endpoint"], "keys": row["keys"]}
        success = push_service.send_notification(
            subscription=subscription,
            title=request.title,
            body=request.body,
            data=request.data,
        )
        results.append({"endpoint": row["endpoint"][:50] + "...", "success": success})
    
    return {"results": results, "total": len(results)}


@router.get("/vapid-public-key")
async def get_vapid_public_key():
    """Get the VAPID public key for client subscription."""
    from app.config import settings
    return {"publicKey": settings.VAPID_PUBLIC_KEY}