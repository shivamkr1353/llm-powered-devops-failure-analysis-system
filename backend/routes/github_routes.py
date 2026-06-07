"""GitHub Actions API routes."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Query, Request

from models.schemas import (
    EnrichedAnalysisResponse,
    GitHubAnalyzeRequest,
    GitHubRunsResponse,
    GitHubWorkflow,
)
from services.analysis_pipeline import run_analysis_pipeline
from services.github_service import (
    GitHubServiceError,
    download_run_logs,
    fetch_failed_runs,
    fetch_workflows,
    get_run_details,
)
from services.rate_limiter import InMemoryRateLimiter

logger = logging.getLogger("failure_analysis_api")

router = APIRouter(prefix="/github", tags=["GitHub Actions"])

_rate_limiter = InMemoryRateLimiter(max_requests=10, window_seconds=60)


def _check_rate_limit(request: Request) -> None:
    client_host = request.client.host if request.client else "anonymous"
    allowed, retry_after = _rate_limiter.is_allowed(f"github:{client_host}")
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Too many GitHub requests. Try again in {retry_after} seconds.",
            headers={"Retry-After": str(retry_after)},
        )


@router.get("/workflows", response_model=list[GitHubWorkflow])
async def get_workflows(
    request: Request,
    owner: str = Query(..., min_length=1, max_length=100),
    repo: str = Query(..., min_length=1, max_length=100),
) -> list[GitHubWorkflow]:
    """List all workflows for a GitHub repository."""

    _check_rate_limit(request)
    custom_token = request.headers.get("X-GitHub-Token")

    try:
        workflows = await fetch_workflows(owner, repo, token=custom_token)
        return [GitHubWorkflow(**w) for w in workflows]
    except GitHubServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/runs", response_model=GitHubRunsResponse)
async def get_runs(
    request: Request,
    owner: str = Query(..., min_length=1, max_length=100),
    repo: str = Query(..., min_length=1, max_length=100),
) -> GitHubRunsResponse:
    """List workflow runs for a GitHub repository."""

    _check_rate_limit(request)
    custom_token = request.headers.get("X-GitHub-Token")

    try:
        result = await fetch_failed_runs(owner, repo, token=custom_token)
        return GitHubRunsResponse(**result)
    except GitHubServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/runs/failed", response_model=GitHubRunsResponse)
async def get_failed_runs(
    request: Request,
    owner: str = Query(..., min_length=1, max_length=100),
    repo: str = Query(..., min_length=1, max_length=100),
) -> GitHubRunsResponse:
    """List only failed workflow runs for a GitHub repository."""

    _check_rate_limit(request)
    custom_token = request.headers.get("X-GitHub-Token")

    try:
        result = await fetch_failed_runs(owner, repo, token=custom_token)
        return GitHubRunsResponse(**result)
    except GitHubServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/analyze-latest", response_model=EnrichedAnalysisResponse)
async def analyze_latest_failure(
    request: Request,
    body: GitHubAnalyzeRequest,
) -> EnrichedAnalysisResponse:
    """Analyze the most recent failed workflow run."""

    _check_rate_limit(request)
    custom_token = request.headers.get("X-GitHub-Token")

    try:
        result = await fetch_failed_runs(body.owner, body.repo, token=custom_token)
        failed_runs = result["runs"]

        if not failed_runs:
            raise HTTPException(status_code=404, detail="No failed workflow runs found.")

        latest_run = failed_runs[0]
        run_id = latest_run["id"]

        logs = await download_run_logs(body.owner, body.repo, run_id, token=custom_token)

        analysis = await run_analysis_pipeline(
            logs,
            source_type="github",
            workflow_name=latest_run.get("workflow_name", ""),
            run_id=str(run_id),
        )

        return EnrichedAnalysisResponse(**analysis)

    except GitHubServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.post("/analyze-run/{run_id}", response_model=EnrichedAnalysisResponse)
async def analyze_specific_run(
    request: Request,
    run_id: int,
    body: GitHubAnalyzeRequest,
) -> EnrichedAnalysisResponse:
    """Analyze a specific GitHub Actions workflow run."""

    _check_rate_limit(request)
    custom_token = request.headers.get("X-GitHub-Token")

    try:
        run_details = await get_run_details(body.owner, body.repo, run_id, token=custom_token)
        logs = await download_run_logs(body.owner, body.repo, run_id, token=custom_token)

        analysis = await run_analysis_pipeline(
            logs,
            source_type="github",
            workflow_name=run_details.get("workflow_name", ""),
            run_id=str(run_id),
        )

        return EnrichedAnalysisResponse(**analysis)

    except GitHubServiceError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
