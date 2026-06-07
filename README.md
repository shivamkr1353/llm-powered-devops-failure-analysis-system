# AI-Powered DevOps Failure Analysis Platform

A full-stack AIOps platform that analyzes CI/CD failure logs with AI, tracks historical incidents, and retrieves similar past failures using RAG (Retrieval-Augmented Generation).

## What The Platform Does

1. **Manual Analysis** — Paste logs from any CI/CD platform and get an AI-powered diagnosis
2. **GitHub Actions Analysis** — Connect repositories and analyze failed workflow runs automatically
3. **Failure History** — Track and search all historical failure analyses with SQLite
4. **RAG Retrieval** — Automatically find similar past failures to improve analysis accuracy with ChromaDB

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI (Python 3.12) |
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS 3 |
| LLM | Gemini API (structured output) |
| RAG | ChromaDB with all-MiniLM-L6-v2 embeddings |
| Database | SQLite via aiosqlite |
| GitHub API | httpx (async HTTP) |
| Deployment | Docker + Render |

## Project Structure

```text
root/
  backend/
    main.py                          # FastAPI app with lifespan, routers, and endpoints
    config.py                        # Environment-based settings
    requirements.txt                 # Python dependencies

    models/
      schemas.py                     # Pydantic request/response schemas

    services/
      log_cleaner.py                 # Log preprocessing and noise removal
      llm_service.py                 # Gemini API integration
      fallback_analyzer.py           # Heuristic fallback when LLM is unavailable
      rate_limiter.py                # In-memory rate limiting
      analysis_pipeline.py           # Shared analysis pipeline (Manual + GitHub)
      github_service.py              # GitHub REST API integration

    database/
      models.py                      # SQLite schema and table creation
      repository.py                  # CRUD operations with repository pattern

    rag/
      chroma_client.py               # ChromaDB persistent client
      embeddings.py                  # Embedding text construction
      retriever.py                   # Similar failure retrieval and storage

    routes/
      github_routes.py               # GitHub Actions API endpoints
      history_routes.py              # Failure history API endpoints

  frontend/
    src/
      App.jsx                        # 3-tab dashboard layout
      api.js                         # Centralized API client
      index.css                      # Global styles with glassmorphism

      components/
        ManualAnalysis.jsx           # Tab 1: Log paste and analysis
        LogInput.jsx                 # Textarea with sample log buttons
        GitHubAnalysis.jsx           # Tab 2: GitHub Actions integration
        RepoSelector.jsx             # Owner/repo input fields
        WorkflowStats.jsx            # Stats cards (total, failed, success rate)
        FailedRunsTable.jsx          # Failed runs table with analyze buttons
        FailureHistory.jsx           # Tab 3: Historical failure browser
        AnalysisPanel.jsx            # Shared result display
        SimilarFailures.jsx          # RAG similar failures panel
        ResultCard.jsx               # Original result card (preserved)
        LoadingState.jsx             # Reusable loading animation
        ErrorState.jsx               # Reusable error display
        ToastNotification.jsx        # Toast notification system

      data/
        sampleLogs.js                # Built-in sample logs
```

## API Endpoints

### Existing (Unchanged)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| POST | `/analyze` | Analyze logs (original response: `{root_cause, summary, fix}`) |

### New

| Method | Path | Description |
|--------|------|-------------|
| POST | `/analyze/enriched` | Analyze logs with similar failures and incident tracking |
| GET | `/github/workflows` | List workflows for a repository |
| GET | `/github/runs` | List workflow runs with stats |
| GET | `/github/runs/failed` | List only failed runs |
| POST | `/github/analyze-latest` | Analyze the most recent failed run |
| POST | `/github/analyze-run/{run_id}` | Analyze a specific run |
| GET | `/history` | Paginated failure history with search |
| GET | `/history/{id}` | Single incident detail |

## Analysis Pipeline

Both Manual and GitHub modes use the same shared pipeline:

```
Logs
→ Clean Logs (remove noise, keep error lines)
→ Retrieve Similar Failures (ChromaDB RAG, top 3)
→ Build Enriched Prompt (current + similar failures)
→ Gemini Analysis (structured JSON output)
→ Store Incident (SQLite)
→ Store Embedding (ChromaDB)
→ Return Response
```

## RAG Architecture

- **Embedding Model**: all-MiniLM-L6-v2 (ChromaDB default, runs locally on CPU)
- **Storage**: ChromaDB persistent client with local filesystem storage
- **Retrieval**: Top 3 similar failures by L2 distance, converted to similarity score
- **Graceful Degradation**: If ChromaDB is empty or unavailable, analysis continues without similar failures

Each analyzed failure is stored as an embedding combining:
- Cleaned log text (truncated to 2000 chars)
- Root cause
- Fix suggestion

## SQLite Architecture

- **Table**: `failure_incidents`
- **Fields**: id, workflow_name, run_id, source_type, logs, root_cause, summary, fix, created_at
- **Indexes**: source_type, created_at (DESC)
- **Repository Pattern**: All SQL is abstracted behind async functions in `database/repository.py`
- **Auto-initialization**: Tables are created on app startup via the FastAPI lifespan

## Local Backend Setup

```bash
cd backend
python -m venv ..\.venv
..\.venv\Scripts\python -m pip install -r requirements.txt
copy .env.example .env
```

Update `.env` with your keys:

```env
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-3.1-flash-lite-preview
ENVIRONMENT=development
CORS_ORIGINS=http://localhost:5173
MAX_LOG_CHARS=20000
RATE_LIMIT_REQUESTS=10
RATE_LIMIT_WINDOW_SECONDS=60
SERVE_FRONTEND=true
GITHUB_TOKEN=your_github_token
DATABASE_URL=data/failures.db
CHROMA_PERSIST_DIRECTORY=data/chroma
```

Run the backend:

```bash
cd backend
..\.venv\Scripts\python -m uvicorn main:app --reload --port 8000
```

API will be available at `http://localhost:8000`.

## GitHub Token Setup

1. Go to [GitHub Settings → Developer Settings → Personal Access Tokens](https://github.com/settings/tokens)
2. Create a **Fine-grained token** with:
   - Repository access: Select the repos you want to analyze
   - Permissions: `Actions: Read-only`
3. Or create a **Classic token** with `repo` scope (for private repos) or `public_repo` (for public repos only)
4. Add the token to `backend/.env`:

```env
GITHUB_TOKEN=ghp_your_token_here
```

**Without a token**: Public repository metadata works, but downloading workflow logs requires authentication.

## Local Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend will run at `http://localhost:5173`.

## Docker Run

```bash
docker build -t devops-failure-analysis .
docker run -p 8000:8000 \
  -v devops-data:/app/backend/data \
  --env GEMINI_API_KEY=your_key \
  --env GITHUB_TOKEN=your_token \
  devops-failure-analysis
```

Then open `http://localhost:8000`.

The `-v devops-data:/app/backend/data` flag persists SQLite and ChromaDB data across container restarts.

## Deploy On Render

1. Push the repo to GitHub.
2. In Render, create a new Blueprint and point it at the GitHub repo.
3. Render will read `render.yaml` from the repo root.
4. Add your real `GEMINI_API_KEY` and optionally `GITHUB_TOKEN` in Render when prompted.
5. Deploy the service and wait for the `/health` check to pass.

The `render.yaml` includes a persistent disk for SQLite and ChromaDB data.

## Migration from v1

If upgrading from the original single-endpoint version:

1. **No breaking changes**: The `POST /analyze` endpoint returns the same `{root_cause, summary, fix}` response.
2. **New dependencies**: Run `pip install -r requirements.txt` to install `chromadb`, `aiosqlite`, and `httpx`.
3. **New env vars**: Add `GITHUB_TOKEN`, `DATABASE_URL`, and `CHROMA_PERSIST_DIRECTORY` to your `.env`.
4. **Data directory**: The backend creates a `data/` directory automatically for SQLite and ChromaDB.
5. **First-time ChromaDB**: On first startup, ChromaDB downloads the embedding model (~80MB). Subsequent starts are instant.

## Example API Requests

### Manual Analysis (Original)

```http
POST /analyze
Content-Type: application/json

{
  "logs": "ERROR: ModuleNotFoundError: No module named 'requests'"
}
```

Response:

```json
{
  "root_cause": "The Python dependency 'requests' is missing.",
  "summary": "The CI pipeline crashed when importing 'requests'.",
  "fix": "Add 'requests' to requirements.txt and rebuild."
}
```

### Enriched Analysis (New)

```http
POST /analyze/enriched
Content-Type: application/json

{
  "logs": "ERROR: ModuleNotFoundError: No module named 'requests'"
}
```

Response:

```json
{
  "root_cause": "The Python dependency 'requests' is missing.",
  "summary": "The CI pipeline crashed when importing 'requests'.",
  "fix": "Add 'requests' to requirements.txt and rebuild.",
  "similar_failures": [
    {
      "root_cause": "Missing 'flask' dependency.",
      "fix": "Add 'flask' to requirements.txt.",
      "similarity_score": 0.85
    }
  ],
  "incident_id": 42
}
```

### GitHub Actions Analysis

```http
POST /github/analyze-run/12345678
Content-Type: application/json

{
  "owner": "facebook",
  "repo": "react"
}
```

## Notes

- No LangChain is used anywhere.
- The backend uses Gemini's structured-output API through the official `google-genai` SDK.
- The app defaults to `gemini-3.1-flash-lite-preview`.
- During migration, the backend will also accept legacy `OPENAI_API_KEY` and `OPENAI_MODEL` env vars if they are still present locally.
- If the model returns invalid JSON, the backend raises a clean API error.
- If the provider request fails, the backend returns a best-effort heuristic analysis instead of a temporary provider error.
- For local development, keep the frontend and backend separate.
- For public deployment, this repo is set up to serve the built frontend from FastAPI through Docker.
- RAG uses ChromaDB with the default `all-MiniLM-L6-v2` embedding model (local, free, CPU-only).
- SQLite is used with the repository pattern for easy future migration to PostgreSQL.
- All new features degrade gracefully — if ChromaDB or SQLite fail, the core analysis still works.
- The `POST /analyze` endpoint is fully backward-compatible with v1 clients.

# Deployed
https://llm-powered-devops-failure-analysis.onrender.com/

