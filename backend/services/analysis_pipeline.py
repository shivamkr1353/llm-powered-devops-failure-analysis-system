"""Shared analysis pipeline used by both Manual and GitHub analysis modes."""

from __future__ import annotations

import html
import logging

from database.repository import store_incident
from rag.retriever import retrieve_similar, store_failure
from services.fallback_analyzer import build_fallback_analysis
from services.llm_service import LLMServiceError, analyze_logs_with_context
from services.log_cleaner import clean_logs

logger = logging.getLogger("failure_analysis_api")


def _clean_llm_text(analysis: dict) -> dict:
    """Decode HTML entities (e.g. &#x27; -> ') that the LLM may inject."""

    return {
        key: html.unescape(value) if isinstance(value, str) else value
        for key, value in analysis.items()
    }


async def run_analysis_pipeline(
    raw_logs: str,
    *,
    source_type: str = "manual",
    workflow_name: str = "",
    run_id: str = "",
) -> dict:
    """Execute the full analysis pipeline.

    Flow:
        1. Clean logs
        2. Retrieve similar failures from ChromaDB (RAG)
        3. Build enriched prompt with similar failures
        4. Call Gemini for analysis
        5. Store result in SQLite
        6. Store embedding in ChromaDB
        7. Return enriched response
    """

    # Step 1: Clean logs.
    cleaned_logs = clean_logs(raw_logs)

    # Step 2: Retrieve similar failures from RAG.
    similar_failures = retrieve_similar(cleaned_logs)

    # Step 3 + 4: Analyze with Gemini (includes similar failures in prompt).
    try:
        analysis = await analyze_logs_with_context(cleaned_logs, raw_logs, similar_failures)
    except LLMServiceError as exc:
        logger.warning("LLM analysis failed, returning fallback analysis: %s", exc)
        analysis = build_fallback_analysis(cleaned_logs, raw_logs)

    # Decode any HTML entities the LLM may have injected (e.g. &#x27; -> ').
    analysis = _clean_llm_text(analysis)

    # Step 5: Store result in SQLite.
    try:
        incident_id = await store_incident(
            workflow_name=workflow_name,
            run_id=run_id,
            source_type=source_type,
            logs=raw_logs[:10000],
            root_cause=analysis["root_cause"],
            summary=analysis["summary"],
            fix=analysis["fix"],
        )
    except Exception as exc:
        logger.warning("Failed to store incident in database (non-fatal): %s", exc)
        incident_id = None

    # Step 6: Store embedding in ChromaDB for future retrieval.
    if incident_id is not None:
        try:
            store_failure(
                incident_id=incident_id,
                logs=cleaned_logs,
                root_cause=analysis["root_cause"],
                fix=analysis["fix"],
            )
        except Exception as exc:
            logger.warning("Failed to store RAG embedding (non-fatal): %s", exc)

    # Step 7: Return enriched response.
    return {
        "root_cause": analysis["root_cause"],
        "summary": analysis["summary"],
        "fix": analysis["fix"],
        "similar_failures": similar_failures,
        "incident_id": incident_id,
    }
