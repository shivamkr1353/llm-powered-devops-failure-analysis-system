/**
 * Centralized API client for all backend endpoints.
 */

const API_BASE_URL = (import.meta.env.VITE_API_URL || "").replace(/\/$/, "")

function endpoint(path) {
  if (API_BASE_URL) {
    try {
      const url = new URL(API_BASE_URL)
      const loc = window.location
      // If we are on the same port and both are local (localhost/127.0.0.1), use relative paths to avoid CORS
      if (
        url.port === loc.port &&
        (url.hostname === "localhost" || url.hostname === "127.0.0.1") &&
        (loc.hostname === "localhost" || loc.hostname === "127.0.0.1")
      ) {
        return path
      }
    } catch {
      // Fallback to absolute URL if parsing fails
    }
    return `${API_BASE_URL}${path}`
  }
  return path
}

async function parseResponseBody(response) {
  const rawBody = await response.text()
  if (!rawBody) return null
  try {
    return JSON.parse(rawBody)
  } catch {
    return rawBody
  }
}

function extractErrorMessage(payload, fallbackMessage) {
  if (!payload) return fallbackMessage
  if (typeof payload === "string") return payload
  if (typeof payload.detail === "string") return payload.detail
  if (Array.isArray(payload.detail)) {
    const messages = payload.detail
      .map((item) => (typeof item?.msg === "string" ? item.msg : ""))
      .filter(Boolean)
    if (messages.length > 0) return messages.join(" ")
  }
  return fallbackMessage
}

async function request(path, options = {}) {
  const url = endpoint(path)
  
  // Read custom github token from localStorage if set
  const token = localStorage.getItem("github_token")
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "X-GitHub-Token": token.trim() } : {}),
    ...(options.headers || {}),
  }

  const response = await fetch(url, {
    ...options,
    headers,
  })
  const payload = await parseResponseBody(response)
  if (!response.ok) {
    throw new Error(extractErrorMessage(payload, `Request to ${path} failed.`))
  }
  return payload
}

// --- Manual Analysis ---

export async function analyzeManual(logs) {
  return request("/analyze/enriched", {
    method: "POST",
    body: JSON.stringify({ logs }),
  })
}

// --- GitHub Actions ---

export async function fetchWorkflows(owner, repo) {
  return request(`/github/workflows?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`)
}

export async function fetchRuns(owner, repo) {
  return request(`/github/runs?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`)
}

export async function fetchFailedRuns(owner, repo) {
  return request(`/github/runs/failed?owner=${encodeURIComponent(owner)}&repo=${encodeURIComponent(repo)}`)
}

export async function analyzeLatest(owner, repo) {
  return request("/github/analyze-latest", {
    method: "POST",
    body: JSON.stringify({ owner, repo }),
  })
}

export async function analyzeRun(owner, repo, runId) {
  return request(`/github/analyze-run/${runId}`, {
    method: "POST",
    body: JSON.stringify({ owner, repo }),
  })
}

// --- Failure History ---

export async function fetchHistory(page = 1, pageSize = 20, search = "") {
  const params = new URLSearchParams({ page, page_size: pageSize })
  if (search.trim()) params.set("search", search.trim())
  return request(`/history?${params.toString()}`)
}

export async function fetchIncident(id) {
  return request(`/history/${id}`)
}
