import { useState, useEffect, useCallback } from "react"
import LoadingState from "./LoadingState"
import ErrorState from "./ErrorState"
import { fetchHistory } from "../api"

/** Format a UTC timestamp from the database into the user's local timezone. */
function formatLocalDate(utcString) {
  if (!utcString) return "—"
  // Ensure the string is treated as UTC.
  const normalized = utcString.endsWith("Z") ? utcString : utcString + "Z"
  const d = new Date(normalized)
  if (isNaN(d.getTime())) return "—"
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function FailureHistory() {
  const [incidents, setIncidents] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [search, setSearch] = useState("")
  const [debouncedSearch, setDebouncedSearch] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [expandedId, setExpandedId] = useState(null)
  const pageSize = 15

  // Debounce search input.
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const loadHistory = useCallback(async () => {
    setIsLoading(true)
    setError("")
    try {
      const data = await fetchHistory(page, pageSize, debouncedSearch)
      setIncidents(data.incidents || [])
      setTotal(data.total || 0)
    } catch (err) {
      setError(err.message || "Failed to load failure history.")
    } finally {
      setIsLoading(false)
    }
  }, [page, debouncedSearch])

  useEffect(() => {
    loadHistory()
  }, [loadHistory])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  const sourceColors = {
    manual: "text-blue-400",
    github: "text-violet-400",
  }

  return (
    <div className="grid gap-4">

      {/* Search bar */}
      <div className="panel p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="tag">HISTORY</span>
            <span className="font-mono text-[11px] text-gray-600">{total} incidents</span>
          </div>
          <div className="relative w-full sm:w-72">
            <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="search incidents..."
              className="input-field pl-9"
            />
          </div>
        </div>
      </div>

      {/* Loading */}
      {isLoading ? (
        <LoadingState message="Loading history" submessage="Fetching stored failure incidents from the database." />
      ) : null}

      {/* Error */}
      {!isLoading && error ? (
        <ErrorState message={error} onRetry={loadHistory} />
      ) : null}

      {/* Empty state */}
      {!isLoading && !error && incidents.length === 0 ? (
        <div className="panel p-8 text-center">
          <p className="font-heading text-base font-semibold text-white">No failures recorded yet</p>
          <p className="mt-2 font-mono text-xs text-gray-500">
            Analyzed failures will appear here. Start by analyzing logs in the Manual or GitHub tab.
          </p>
        </div>
      ) : null}

      {/* Incident list */}
      {!isLoading && !error && incidents.length > 0 ? (
        <div className="grid gap-2">
          {incidents.map((incident) => (
            <div
              key={incident.id}
              className="panel cursor-pointer overflow-hidden transition-colors hover:border-white/[0.12]"
              onClick={() => setExpandedId(expandedId === incident.id ? null : incident.id)}
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex flex-1 flex-wrap items-center gap-3">
                  <span className={`font-mono text-[11px] font-semibold ${sourceColors[incident.source_type] || sourceColors.manual}`}>
                    {incident.source_type}
                  </span>
                  {incident.workflow_name ? (
                    <span className="text-sm text-gray-300">{incident.workflow_name}</span>
                  ) : null}
                  <span className="font-mono text-[11px] text-gray-600">
                    {formatLocalDate(incident.created_at)}
                  </span>
                </div>
                <svg
                  className={`h-3.5 w-3.5 shrink-0 text-gray-600 transition-transform duration-200 ${expandedId === incident.id ? "rotate-180" : ""}`}
                  fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </div>

              {/* Preview line */}
              {expandedId !== incident.id ? (
                <div className="border-t border-white/[0.05] px-4 pb-3 pt-2">
                  <p className="font-mono text-[11px] text-gray-500 line-clamp-1">
                    {incident.root_cause || "No root cause recorded."}
                  </p>
                </div>
              ) : null}

              {/* Expanded detail */}
              {expandedId === incident.id ? (
                <div className="border-t border-white/[0.08] p-4">
                  <div className="grid gap-3">
                    <div className="accent-card accent-card--orange p-4">
                      <p className="font-mono text-[10px] font-bold text-gray-500 tracking-wider mb-1.5">ROOT CAUSE</p>
                      <p className="text-sm text-gray-200 leading-relaxed">{incident.root_cause}</p>
                    </div>
                    <div className="accent-card accent-card--blue p-4">
                      <p className="font-mono text-[10px] font-bold text-gray-500 tracking-wider mb-1.5">SUMMARY</p>
                      <p className="text-sm text-gray-200 leading-relaxed">{incident.summary}</p>
                    </div>
                    <div className="accent-card accent-card--green p-4">
                      <p className="font-mono text-[10px] font-bold text-gray-500 tracking-wider mb-1.5">FIX</p>
                      <p className="text-sm text-gray-200 leading-relaxed">{incident.fix}</p>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ))}
        </div>
      ) : null}

      {/* Pagination */}
      {!isLoading && total > pageSize ? (
        <div className="flex items-center justify-center gap-3">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="btn-ghost"
          >
            ← prev
          </button>
          <span className="font-mono text-xs text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="btn-ghost"
          >
            next →
          </button>
        </div>
      ) : null}

    </div>
  )
}

export default FailureHistory
