"""Failure history API routes."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query

from database.repository import get_incident_by_id, get_incident_count, get_incidents
from models.schemas import FailureIncident, HistoryResponse

logger = logging.getLogger("failure_analysis_api")

router = APIRouter(prefix="/history", tags=["Failure History"])


@router.get("", response_model=HistoryResponse)
async def list_incidents(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    search: str = Query("", description="Search term for filtering"),
) -> HistoryResponse:
    """Return paginated failure history with optional search."""

    offset = (page - 1) * page_size
    search_term = search.strip() if search else None

    try:
        incidents = await get_incidents(limit=page_size, offset=offset, search=search_term)
        total = await get_incident_count(search=search_term)

        return HistoryResponse(
            incidents=[FailureIncident(**inc) for inc in incidents],
            total=total,
            page=page,
            page_size=page_size,
        )
    except Exception as exc:
        logger.exception("Failed to fetch failure history.")
        raise HTTPException(status_code=500, detail="Failed to load failure history.") from exc


@router.get("/{incident_id}", response_model=FailureIncident)
async def get_incident(incident_id: int) -> FailureIncident:
    """Get a single failure incident by ID."""

    try:
        incident = await get_incident_by_id(incident_id)
        if not incident:
            raise HTTPException(status_code=404, detail=f"Incident {incident_id} not found.")
        return FailureIncident(**incident)
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Failed to fetch incident %s.", incident_id)
        raise HTTPException(status_code=500, detail="Failed to load incident.") from exc
