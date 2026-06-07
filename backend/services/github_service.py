"""GitHub Actions integration — fetch workflows, runs, and logs via REST API."""

from __future__ import annotations

import io
import logging
import re
import zipfile

import httpx

from config import get_settings

logger = logging.getLogger("failure_analysis_api")

GITHUB_API_BASE = "https://api.github.com"
REPO_NAME_PATTERN = re.compile(r"^[a-zA-Z0-9._-]+$")


class GitHubServiceError(Exception):
    """Raised when a GitHub API operation fails."""


def _validate_repo_params(owner: str, repo: str) -> None:
    """Validate owner and repo names to prevent injection."""

    if not owner or not REPO_NAME_PATTERN.match(owner):
        raise GitHubServiceError(f"Invalid repository owner: '{owner}'")
    if not repo or not REPO_NAME_PATTERN.match(repo):
        raise GitHubServiceError(f"Invalid repository name: '{repo}'")


def _build_headers() -> dict[str, str]:
    """Build request headers, optionally including auth token."""

    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
    }

    token = get_settings().github_token
    if token:
        headers["Authorization"] = f"Bearer {token}"

    return headers


async def fetch_workflows(owner: str, repo: str) -> list[dict]:
    """Fetch all workflows for a GitHub repository."""

    _validate_repo_params(owner, repo)

    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/workflows"
    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_build_headers())

    if response.status_code == 404:
        raise GitHubServiceError(
            f"Repository '{owner}/{repo}' not found. Check the owner/repo name or ensure the token has access."
        )
    if response.status_code == 401:
        raise GitHubServiceError("GitHub authentication failed. Check your GITHUB_TOKEN.")
    if response.status_code == 403:
        raise GitHubServiceError("GitHub API rate limit exceeded or insufficient permissions.")

    response.raise_for_status()
    data = response.json()

    return [
        {
            "id": w["id"],
            "name": w["name"],
            "path": w.get("path", ""),
            "state": w.get("state", "unknown"),
        }
        for w in data.get("workflows", [])
    ]


async def fetch_runs(
    owner: str,
    repo: str,
    *,
    workflow_id: int | None = None,
    status: str | None = None,
    per_page: int = 30,
) -> list[dict]:
    """Fetch workflow runs, optionally filtered by workflow_id and/or status."""

    _validate_repo_params(owner, repo)

    if workflow_id:
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/workflows/{workflow_id}/runs"
    else:
        url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/runs"

    params: dict[str, str | int] = {"per_page": per_page}
    if status:
        params["status"] = status

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_build_headers(), params=params)

    if response.status_code == 404:
        raise GitHubServiceError(f"Repository '{owner}/{repo}' not found.")
    if response.status_code in (401, 403):
        raise GitHubServiceError("GitHub authentication failed or rate limit exceeded.")

    response.raise_for_status()
    data = response.json()

    return [
        {
            "id": r["id"],
            "name": r.get("name", ""),
            "workflow_name": r.get("name", ""),
            "head_branch": r.get("head_branch", ""),
            "status": r.get("status", ""),
            "conclusion": r.get("conclusion", ""),
            "created_at": r.get("created_at", ""),
            "updated_at": r.get("updated_at", ""),
            "html_url": r.get("html_url", ""),
            "run_number": r.get("run_number", 0),
        }
        for r in data.get("workflow_runs", [])
    ]


async def fetch_failed_runs(owner: str, repo: str, per_page: int = 30) -> dict:
    """Fetch all completed runs and separate failed ones. Return stats and failed list."""

    all_runs = await fetch_runs(owner, repo, status="completed", per_page=per_page)

    failed_runs = [r for r in all_runs if r["conclusion"] == "failure"]
    total = len(all_runs)
    failed = len(failed_runs)
    success_rate = round(((total - failed) / total) * 100, 1) if total > 0 else 0.0

    return {
        "total_runs": total,
        "failed_runs": failed,
        "success_rate": success_rate,
        "runs": failed_runs,
    }


async def download_run_logs(owner: str, repo: str, run_id: int) -> str:
    """Download and extract workflow run logs as plain text."""

    _validate_repo_params(owner, repo)

    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/runs/{run_id}/logs"

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True) as client:
        response = await client.get(url, headers=_build_headers())

    if response.status_code == 404:
        raise GitHubServiceError(f"Logs not found for run {run_id}. The run may have expired.")
    if response.status_code in (401, 403):
        raise GitHubServiceError(
            "Cannot download logs. A GITHUB_TOKEN with 'actions:read' scope is required."
        )

    response.raise_for_status()

    # GitHub returns logs as a ZIP archive.
    try:
        log_parts: list[str] = []
        with zipfile.ZipFile(io.BytesIO(response.content)) as zf:
            for name in sorted(zf.namelist()):
                if name.endswith(".txt"):
                    content = zf.read(name).decode("utf-8", errors="replace")
                    log_parts.append(f"--- {name} ---\n{content}\n")

        combined = "\n".join(log_parts).strip()
        if not combined:
            raise GitHubServiceError(f"No text log files found in the archive for run {run_id}.")

        return combined

    except zipfile.BadZipFile as exc:
        raise GitHubServiceError(f"GitHub returned an invalid log archive for run {run_id}.") from exc


async def get_run_details(owner: str, repo: str, run_id: int) -> dict:
    """Get details for a specific workflow run."""

    _validate_repo_params(owner, repo)

    url = f"{GITHUB_API_BASE}/repos/{owner}/{repo}/actions/runs/{run_id}"

    async with httpx.AsyncClient(timeout=15.0) as client:
        response = await client.get(url, headers=_build_headers())

    if response.status_code == 404:
        raise GitHubServiceError(f"Run {run_id} not found in '{owner}/{repo}'.")

    response.raise_for_status()
    r = response.json()

    return {
        "id": r["id"],
        "name": r.get("name", ""),
        "workflow_name": r.get("name", ""),
        "head_branch": r.get("head_branch", ""),
        "status": r.get("status", ""),
        "conclusion": r.get("conclusion", ""),
        "created_at": r.get("created_at", ""),
        "html_url": r.get("html_url", ""),
    }
