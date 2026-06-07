"""RAG retriever — store and retrieve similar failures using ChromaDB."""

from __future__ import annotations

import html
import logging

from rag.chroma_client import get_collection
from rag.embeddings import generate_embedding_text

logger = logging.getLogger("failure_analysis_api")


def retrieve_similar(logs: str, top_k: int = 3) -> list[dict]:
    """Query ChromaDB for the top-k most similar historical failures.

    Returns a list of dicts with keys: root_cause, fix, similarity_score.
    Gracefully returns an empty list if ChromaDB is empty or unavailable.
    """

    try:
        collection = get_collection()

        if collection.count() == 0:
            return []

        query_text = generate_embedding_text(logs=logs, root_cause="", fix="")
        if not query_text.strip():
            return []

        results = collection.query(
            query_texts=[query_text],
            n_results=min(top_k, collection.count()),
            include=["metadatas", "distances"],
        )

        similar_failures = []

        if results and results["metadatas"] and results["metadatas"][0]:
            for i, metadata in enumerate(results["metadatas"][0]):
                distance = results["distances"][0][i] if results["distances"] else 1.0
                # ChromaDB returns L2 distances. Convert to a 0-1 similarity score.
                similarity_score = max(0.0, round(1.0 / (1.0 + distance), 3))

                similar_failures.append({
                    "root_cause": html.unescape(metadata.get("root_cause", "")),
                    "fix": html.unescape(metadata.get("fix", "")),
                    "similarity_score": similarity_score,
                })

        return similar_failures

    except Exception as exc:
        logger.warning("RAG retrieval failed (non-fatal): %s", exc)
        return []


def store_failure(incident_id: int, logs: str, root_cause: str, fix: str) -> None:
    """Add a failure's embedding to ChromaDB for future similarity retrieval."""

    try:
        collection = get_collection()

        document_text = generate_embedding_text(logs=logs, root_cause=root_cause, fix=fix)
        if not document_text.strip():
            return

        collection.add(
            ids=[str(incident_id)],
            documents=[document_text],
            metadatas=[{
                "incident_id": str(incident_id),
                "root_cause": html.unescape(root_cause[:1000]),
                "fix": html.unescape(fix[:1000]),
            }],
        )
        logger.info("Stored failure embedding for incident %s", incident_id)

    except Exception as exc:
        logger.warning("RAG storage failed (non-fatal): %s", exc)
