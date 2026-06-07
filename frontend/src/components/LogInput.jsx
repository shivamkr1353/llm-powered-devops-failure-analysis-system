function LogInput({ logs, onLogsChange, onAnalyze, isLoading, maxLogChars, examples, onLoadExample }) {
  const trimmedLogLength = logs.trim().length
  const isTooLong = trimmedLogLength > maxLogChars

  return (
    <section className="panel p-5 lg:p-6">
      <div className="flex flex-col gap-5">

        {/* Sample log buttons */}
        <div className="flex flex-col gap-3">
          <span className="tag">INPUT LOGS</span>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example.id}
                type="button"
                onClick={() => onLoadExample(example.logs)}
                className="btn-ghost text-[11px]"
              >
                <span className="text-accent mr-1">›</span>
                {example.title}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal-style textarea */}
        <div className="rounded-md border border-white/[0.08] overflow-hidden">
          {/* Fake terminal title bar */}
          <div className="flex items-center gap-2 px-3 py-2 bg-[#0d0d14] border-b border-white/[0.06]">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/60" />
            <span className="h-2.5 w-2.5 rounded-full bg-green-500/60" />
            <span className="ml-2 font-mono text-[10px] text-gray-600">pipeline.log</span>
          </div>
          <textarea
            value={logs}
            onChange={(event) => onLogsChange(event.target.value)}
            placeholder="$ paste ci/cd logs here..."
            className="min-h-[280px] w-full bg-[#0a0a0f] px-4 py-3 font-mono text-sm leading-6 text-gray-300 outline-none resize-none placeholder:text-gray-700"
          />
        </div>

        {/* Bottom controls */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <p className="font-mono text-xs text-gray-500">
              Logs are cleaned server-side — noise removed, error lines kept, then sent to the LLM.
            </p>
            <p className={`font-mono text-[11px] ${isTooLong ? "text-red-400" : "text-gray-600"}`}>
              {trimmedLogLength.toLocaleString()} / {maxLogChars.toLocaleString()} chars
            </p>
          </div>

          <button
            type="button"
            onClick={onAnalyze}
            disabled={isLoading || isTooLong}
            className="btn-primary shrink-0"
          >
            {isLoading ? "analyzing..." : "Analyze"}
          </button>
        </div>

      </div>
    </section>
  )
}

export default LogInput
