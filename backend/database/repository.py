"""Repository layer for failure incident CRUD operations."""

from __future__ import annotations

from datetime import datetime

import html
import aiosqlite

from config import get_settings


def _get_db_path() -> str:
    return get_settings().database_url


def _sanitize(text: str) -> str:
    """Strip leading/trailing whitespace for safe storage."""

    return text.strip() if text else ""


def _row_to_dict(row: aiosqlite.Row, columns: list[str]) -> dict:
    """Convert an aiosqlite Row to a plain dictionary and unescape HTML entities."""

    d = dict(zip(columns, row))
    for field in ("root_cause", "summary", "fix", "workflow_name"):
        if field in d and isinstance(d[field], str):
            d[field] = html.unescape(d[field])
    return d


async def store_incident(
    *,
    workflow_name: str = "",
    run_id: str = "",
    source_type: str = "manual",
    logs: str,
    root_cause: str,
    summary: str,
    fix: str,
) -> int:
    """Insert a new failure incident and return its id."""

    async with aiosqlite.connect(_get_db_path()) as db:
        cursor = await db.execute(
            """
            INSERT INTO failure_incidents
                (workflow_name, run_id, source_type, logs, root_cause, summary, fix)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                _sanitize(workflow_name),
                _sanitize(run_id),
                _sanitize(source_type),
                _sanitize(logs),
                _sanitize(root_cause),
                _sanitize(summary),
                _sanitize(fix),
            ),
        )
        await db.commit()
        return cursor.lastrowid


COLUMNS = [
    "id", "workflow_name", "run_id", "source_type",
    "logs", "root_cause", "summary", "fix", "created_at",
]


async def get_incidents(
    limit: int = 20,
    offset: int = 0,
    search: str | None = None,
) -> list[dict]:
    """Return a paginated list of failure incidents, newest first."""

    async with aiosqlite.connect(_get_db_path()) as db:
        if search and search.strip():
            query = """
                SELECT id, workflow_name, run_id, source_type,
                       logs, root_cause, summary, fix, created_at
                FROM failure_incidents
                WHERE root_cause LIKE ? OR summary LIKE ? OR fix LIKE ?
                      OR workflow_name LIKE ?
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            """
            pattern = f"%{search.strip()}%"
            params = (pattern, pattern, pattern, pattern, limit, offset)
        else:
            query = """
                SELECT id, workflow_name, run_id, source_type,
                       logs, root_cause, summary, fix, created_at
                FROM failure_incidents
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            """
            params = (limit, offset)

        rows = await db.execute_fetchall(query, params)
        return [_row_to_dict(row, COLUMNS) for row in rows]


async def get_incident_by_id(incident_id: int) -> dict | None:
    """Fetch a single failure incident by its primary key."""

    async with aiosqlite.connect(_get_db_path()) as db:
        cursor = await db.execute(
            """
            SELECT id, workflow_name, run_id, source_type,
                   logs, root_cause, summary, fix, created_at
            FROM failure_incidents
            WHERE id = ?
            """,
            (incident_id,),
        )
        row = await cursor.fetchone()
        return _row_to_dict(row, COLUMNS) if row else None


async def get_incident_count(search: str | None = None) -> int:
    """Return the total number of incidents, optionally filtered by search."""

    async with aiosqlite.connect(_get_db_path()) as db:
        if search and search.strip():
            query = """
                SELECT COUNT(*) FROM failure_incidents
                WHERE root_cause LIKE ? OR summary LIKE ? OR fix LIKE ?
                      OR workflow_name LIKE ?
            """
            pattern = f"%{search.strip()}%"
            params = (pattern, pattern, pattern, pattern)
        else:
            query = "SELECT COUNT(*) FROM failure_incidents"
            params = ()

        cursor = await db.execute(query, params)
        row = await cursor.fetchone()
        return row[0] if row else 0
