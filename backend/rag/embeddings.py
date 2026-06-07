"""Embedding text construction for ChromaDB storage and retrieval."""


def generate_embedding_text(logs: str, root_cause: str, fix: str) -> str:
    """Combine failure fields into a single string for embedding generation.

    ChromaDB uses its default all-MiniLM-L6-v2 model to generate embeddings
    from this combined text. We structure it so that semantically similar
    failures cluster together in the embedding space.
    """

    parts = []

    if logs:
        # Use a truncated version of the logs to keep embedding size reasonable.
        log_excerpt = logs[:2000].strip()
        parts.append(f"LOGS:\n{log_excerpt}")

    if root_cause:
        parts.append(f"ROOT CAUSE:\n{root_cause.strip()}")

    if fix:
        parts.append(f"FIX:\n{fix.strip()}")

    return "\n\n".join(parts) if parts else ""
