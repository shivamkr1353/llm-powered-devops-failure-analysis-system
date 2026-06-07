from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from config import get_settings


class AnalysisRequest(BaseModel):
    """Incoming request payload for log analysis."""

    logs: str = Field(..., description="Raw CI/CD logs to analyze")

    @field_validator("logs")
    @classmethod
    def validate_logs(cls, value: str) -> str:
        normalized_logs = value.strip()
        if not normalized_logs:
            raise ValueError("Logs cannot be empty.")

        max_log_chars = get_settings().max_log_chars
        if len(normalized_logs) > max_log_chars:
            raise ValueError(f"Logs cannot exceed {max_log_chars} characters.")

        return normalized_logs


class AnalysisResponse(BaseModel):
    """Structured response returned to the frontend."""

    root_cause: str
    summary: str
    fix: str


# --- New schemas for the extended platform ---


class SimilarFailure(BaseModel):
    """A single similar historical failure from RAG retrieval."""

    root_cause: str = ""
    fix: str = ""
    similarity_score: float = 0.0


class EnrichedAnalysisResponse(BaseModel):
    """Extended response that includes similar failures and incident tracking."""

    root_cause: str
    summary: str
    fix: str
    similar_failures: list[SimilarFailure] = []
    incident_id: int | None = None


class GitHubRepoRequest(BaseModel):
    """Query parameters for GitHub repository operations."""

    owner: str = Field(..., min_length=1, max_length=100, description="GitHub repository owner")
    repo: str = Field(..., min_length=1, max_length=100, description="GitHub repository name")


class GitHubAnalyzeRequest(BaseModel):
    """Request to analyze a specific GitHub Actions run."""

    owner: str = Field(..., min_length=1, max_length=100)
    repo: str = Field(..., min_length=1, max_length=100)


class GitHubWorkflow(BaseModel):
    """Workflow metadata from GitHub."""

    id: int
    name: str
    path: str = ""
    state: str = "unknown"


class GitHubRun(BaseModel):
    """Workflow run metadata from GitHub."""

    id: int
    name: str = ""
    workflow_name: str = ""
    head_branch: str = ""
    status: str = ""
    conclusion: str = ""
    created_at: str = ""
    updated_at: str = ""
    html_url: str = ""
    run_number: int = 0


class GitHubRunsResponse(BaseModel):
    """Response containing workflow runs and statistics."""

    total_runs: int = 0
    failed_runs: int = 0
    success_rate: float = 0.0
    runs: list[GitHubRun] = []


class FailureIncident(BaseModel):
    """A stored failure incident from the database."""

    id: int
    workflow_name: str = ""
    run_id: str = ""
    source_type: str = "manual"
    logs: str = ""
    root_cause: str = ""
    summary: str = ""
    fix: str = ""
    created_at: str = ""


class HistoryResponse(BaseModel):
    """Paginated response for failure history."""

    incidents: list[FailureIncident] = []
    total: int = 0
    page: int = 1
    page_size: int = 20

