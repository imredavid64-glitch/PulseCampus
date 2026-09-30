from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
import asyncpg
from app.database import get_db
from app.schemas import KindnessChainCreate, KindnessChainResponse

router = APIRouter(prefix="/kindness-chains", tags=["kindness-chains"])


@router.get("", response_model=List[KindnessChainResponse])
async def get_kindness_chains(db=Depends(get_db)):
    """Get all kindness chains."""
    query = """
        SELECT id, helper_pulse_id, helped_pulse_id, chain_type, created_at
        FROM kindness_chains
        ORDER BY created_at DESC
    """
    rows = await db.fetch(query)
    return [
        KindnessChainResponse(
            id=str(row["id"]),
            helper_pulse_id=str(row["helper_pulse_id"]),
            helped_pulse_id=str(row["helped_pulse_id"]),
            chain_type=row["chain_type"],
            created_at=row["created_at"]
        )
        for row in rows
    ]


@router.post("", response_model=KindnessChainResponse, status_code=status.HTTP_201_CREATED)
async def create_kindness_chain(chain: KindnessChainCreate, db=Depends(get_db)):
    """Create a new kindness chain (when someone helps with a pulse)."""
    # Verify both pulses exist
    helper_pulse = await db.fetchrow(
        "SELECT id FROM pulses WHERE id = $1",
        chain.helper_pulse_id
    )
    helped_pulse = await db.fetchrow(
        "SELECT id FROM pulses WHERE id = $1",
        chain.helped_pulse_id
    )
    
    if not helper_pulse or not helped_pulse:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="One or both pulses not found"
        )
    
    # Check if chain already exists
    existing = await db.fetchrow(
        "SELECT id FROM kindness_chains WHERE helper_pulse_id = $1 AND helped_pulse_id = $2",
        chain.helper_pulse_id, chain.helped_pulse_id
    )
    
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Kindness chain already exists"
        )
    
    row = await db.fetchrow(
        """
        INSERT INTO kindness_chains (helper_pulse_id, helped_pulse_id, chain_type)
        VALUES ($1, $2, $3)
        RETURNING id, helper_pulse_id, helped_pulse_id, chain_type, created_at
        """,
        chain.helper_pulse_id, chain.helped_pulse_id, chain.chain_type
    )
    
    return KindnessChainResponse(
        id=str(row["id"]),
        helper_pulse_id=str(row["helper_pulse_id"]),
        helped_pulse_id=str(row["helped_pulse_id"]),
        chain_type=row["chain_type"],
        created_at=row["created_at"]
    )


@router.get("/pulse/{pulse_id}", response_model=List[KindnessChainResponse])
async def get_chains_for_pulse(pulse_id: str, db=Depends(get_db)):
    """Get all kindness chains involving a specific pulse (as helper or helped)."""
    query = """
        SELECT id, helper_pulse_id, helped_pulse_id, chain_type, created_at
        FROM kindness_chains
        WHERE helper_pulse_id = $1 OR helped_pulse_id = $1
        ORDER BY created_at DESC
    """
    rows = await db.fetch(query, pulse_id)
    return [
        KindnessChainResponse(
            id=str(row["id"]),
            helper_pulse_id=str(row["helper_pulse_id"]),
            helped_pulse_id=str(row["helped_pulse_id"]),
            chain_type=row["chain_type"],
            created_at=row["created_at"]
        )
        for row in rows
    ]


@router.delete("/{chain_id}")
async def delete_kindness_chain(chain_id: str, db=Depends(get_db)):
    """Delete a kindness chain."""
    result = await db.execute(
        "DELETE FROM kindness_chains WHERE id = $1",
        chain_id
    )
    if result == "DELETE 0":
        raise HTTPException(status_code=404, detail="Chain not found")
    return {"message": "Chain deleted"}