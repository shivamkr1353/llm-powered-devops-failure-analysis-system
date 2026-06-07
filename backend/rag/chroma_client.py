"""Singleton ChromaDB persistent client and collection management."""

from __future__ import annotations

import logging
from pathlib import Path

import chromadb

from config import get_settings

logger = logging.getLogger("failure_analysis_api")

_client: chromadb.PersistentClient | None = None

COLLECTION_NAME = "failure_embeddings"


def get_chroma_client() -> chromadb.PersistentClient:
    """Return a singleton ChromaDB persistent client."""

    global _client

    if _client is not None:
        return _client

    persist_dir = get_settings().chroma_persist_directory
    Path(persist_dir).mkdir(parents=True, exist_ok=True)

    _client = chromadb.PersistentClient(path=persist_dir)
    logger.info("ChromaDB persistent client initialized at %s", persist_dir)
    return _client


def get_collection() -> chromadb.Collection:
    """Return the failure_embeddings collection, creating it if needed."""

    client = get_chroma_client()
    return client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"description": "CI/CD failure logs, root causes, and fixes"},
    )
