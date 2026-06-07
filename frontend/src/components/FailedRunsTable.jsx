function FailedRunsTable({ runs = [], onAnalyze, analyzingRunId = null }) {
  if (runs.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-white/[0.08] p-6 text-center">
        <p className="font-mono text-xs text-emerald-400 font-semibold">✓ No failed runs found</p>
        <p className="mt-1 font-mono text-[11px] text-gray-600">All recent workflow runs completed successfully.</p>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-white/[0.08]">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-white/[0.08] bg-surface-raised">
              <th className="px-4 py-2.5 font-mono text-[10px] font-semibold text-gray-500 tracking-wider">RUN</th>
              <th className="px-4 py-2.5 font-mono text-[10px] font-semibold text-gray-500 tracking-wider">WORKFLOW</th>
              <th className="hidden px-4 py-2.5 font-mono text-[10px] font-semibold text-gray-500 tracking-wider md:table-cell">BRANCH</th>
              <th className="px-4 py-2.5 font-mono text-[10px] font-semibold text-gray-500 tracking-wider">STATUS</th>
              <th className="hidden px-4 py-2.5 font-mono text-[10px] font-semibold text-gray-500 tracking-wider lg:table-cell">CREATED</th>
              <th className="px-4 py-2.5 font-mono text-[10px] font-semibold text-gray-500 tracking-wider">ACTION</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr
                key={run.id}
                className="border-b border-white/[0.05] transition-colors hover:bg-white/[0.02]"
              >
                <td className="px-4 py-3">
                  <span className="font-mono text-xs text-gray-400">#{run.run_number || run.id}</span>
                </td>
                <td className="px-4 py-3">
                  <span className="text-sm text-gray-300">{run.workflow_name || run.name || "—"}</span>
                </td>
                <td className="hidden px-4 py-3 md:table-cell">
                  <span className="font-mono text-xs text-gray-500">
                    {run.head_branch || "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1.5 font-mono text-xs text-red-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                    {run.conclusion || "failure"}
                  </span>
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <span className="font-mono text-[11px] text-gray-500">
                    {run.created_at ? new Date(run.created_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }) : "—"}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => onAnalyze(run.id)}
                    disabled={analyzingRunId === run.id}
                    className="btn-primary py-1.5 px-3 text-xs"
                  >
                    {analyzingRunId === run.id ? "analyzing..." : "Analyze"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default FailedRunsTable
