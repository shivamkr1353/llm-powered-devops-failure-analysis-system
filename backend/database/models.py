"""SQLite schema and table management for failure incidents."""

import aiosqlite

CREATE_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS failure_incidents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workflow_name TEXT DEFAULT '',
    run_id TEXT DEFAULT '',
    source_type TEXT NOT NULL DEFAULT 'manual',
    logs TEXT NOT NULL,
    root_cause TEXT NOT NULL,
    summary TEXT NOT NULL,
    fix TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
"""

CREATE_INDEX_SQL = [
    "CREATE INDEX IF NOT EXISTS idx_source_type ON failure_incidents(source_type);",
    "CREATE INDEX IF NOT EXISTS idx_created_at ON failure_incidents(created_at DESC);",
]


async def create_tables(db_path: str) -> None:
    """Create the failure_incidents table and indexes if they do not exist."""

    async with aiosqlite.connect(db_path) as db:
        await db.execute(CREATE_TABLE_SQL)
        for index_sql in CREATE_INDEX_SQL:
            await db.execute(index_sql)
        await db.commit()
