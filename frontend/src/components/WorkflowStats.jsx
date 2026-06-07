function WorkflowStats({ totalRuns = 0, failedRuns = 0, successRate = 0 }) {
  const stats = [
    {
      label: "TOTAL RUNS",
      value: totalRuns,
      accentClass: "accent-card--blue",
    },
    {
      label: "FAILED",
      value: failedRuns,
      accentClass: "accent-card--red",
    },
    {
      label: "SUCCESS RATE",
      value: `${successRate}%`,
      accentClass: "accent-card--green",
    },
  ]

  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {stats.map((stat) => (
        <div key={stat.label} className={`accent-card ${stat.accentClass} p-4`}>
          <p className="font-mono text-[10px] font-semibold text-gray-500 tracking-wider">
            {stat.label}
          </p>
          <p className="mt-1.5 font-mono text-2xl font-bold text-white">
            {stat.value}
          </p>
        </div>
      ))}
    </div>
  )
}

export default WorkflowStats
