function SimilarFailures({ failures = [] }) {
  if (!failures || failures.length === 0) return null

  return (
    <div className="accent-card accent-card--violet p-4 mt-1">
      <div className="mb-3">
        <p className="font-mono text-[10px] font-bold text-gray-500 tracking-wider">
          SIMILAR HISTORICAL FAILURES
        </p>
      </div>

      <div className="grid gap-2">
        {failures.map((failure, index) => (
          <div
            key={index}
            className="rounded-md border border-white/[0.06] bg-surface p-3"
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold text-violet-400">
                match #{index + 1}
              </span>
              <div className="flex items-center gap-2">
                <div className="h-1 w-16 overflow-hidden rounded-full bg-white/[0.06]">
                  <div
                    className="h-full rounded-full bg-violet-500 transition-all duration-500"
                    style={{ width: `${Math.round((failure.similarity_score || 0) * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] font-semibold text-gray-400">
                  {Math.round((failure.similarity_score || 0) * 100)}%
                </span>
              </div>
            </div>

            {failure.root_cause ? (
              <div className="mb-1.5">
                <p className="font-mono text-[10px] text-gray-500 mb-0.5">root cause</p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {failure.root_cause.length > 200
                    ? `${failure.root_cause.slice(0, 200)}...`
                    : failure.root_cause}
                </p>
              </div>
            ) : null}

            {failure.fix ? (
              <div>
                <p className="font-mono text-[10px] text-gray-500 mb-0.5">fix</p>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {failure.fix.length > 200 ? `${failure.fix.slice(0, 200)}...` : failure.fix}
                </p>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  )
}

export default SimilarFailures
