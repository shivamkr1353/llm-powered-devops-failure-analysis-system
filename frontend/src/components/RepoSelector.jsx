function RepoSelector({ owner, repo, onOwnerChange, onRepoChange, onFetch, isLoading }) {
  return (
    <div className="panel p-5">
      <div className="mb-4 flex items-center gap-2">
        <span className="tag">REPOSITORY</span>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label className="mb-1.5 block font-mono text-[11px] text-gray-500">owner</label>
          <input
            type="text"
            value={owner}
            onChange={(e) => onOwnerChange(e.target.value)}
            placeholder="facebook"
            className="input-field"
          />
        </div>

        <span className="hidden pb-2.5 font-mono text-gray-600 sm:block">/</span>

        <div className="flex-1">
          <label className="mb-1.5 block font-mono text-[11px] text-gray-500">repo</label>
          <input
            type="text"
            value={repo}
            onChange={(e) => onRepoChange(e.target.value)}
            placeholder="react"
            className="input-field"
          />
        </div>

        <button
          type="button"
          onClick={onFetch}
          disabled={isLoading || !owner.trim() || !repo.trim()}
          className="btn-primary shrink-0"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              fetching...
            </span>
          ) : (
            "Fetch Runs"
          )}
        </button>
      </div>
    </div>
  )
}

export default RepoSelector
