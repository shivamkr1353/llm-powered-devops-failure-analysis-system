import { useState } from "react"
import SimilarFailures from "./SimilarFailures"
import LoadingState from "./LoadingState"

function AnalysisPanel({ result, isLoading, error, loadingMessage = "Analyzing pipeline failure" }) {
  const [copiedLabel, setCopiedLabel] = useState("")

  const sections = result
    ? [
        {
          key: "root_cause",
          title: "Root Cause",
          value: result.root_cause,
          accentClass: "accent-card--orange",
        },
        {
          key: "summary",
          title: "Summary",
          value: result.summary,
          accentClass: "accent-card--blue",
        },
        {
          key: "fix",
          title: "Fix Suggestion",
          value: result.fix,
          accentClass: "accent-card--green",
        },
      ]
    : []

  const copyText = async (label, text) => {
    await navigator.clipboard.writeText(text)
    setCopiedLabel(label)
    window.setTimeout(() => setCopiedLabel(""), 1600)
  }

  return (
    <section className="panel min-h-[380px] p-5 lg:p-6">
      <div className="flex h-full flex-col gap-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="tag">ANALYSIS RESULT</span>
          {result ? (
            <button
              type="button"
              onClick={() =>
                copyText(
                  "analysis",
                  `Root Cause:\n${result.root_cause}\n\nSummary:\n${result.summary}\n\nFix:\n${result.fix}`
                )
              }
              className="btn-ghost"
            >
              {copiedLabel === "analysis" ? "✓ copied" : "copy all"}
            </button>
          ) : null}
        </div>

        {/* Loading */}
        {isLoading ? (
          <LoadingState
            message={loadingMessage}
            submessage="Cleaning logs, retrieving similar failures, running LLM analysis."
          />
        ) : null}

        {/* Error */}
        {!isLoading && error ? (
          <div className="accent-card accent-card--red p-4">
            <p className="font-mono text-xs font-bold text-red-400 mb-1">ERROR</p>
            <p className="text-sm text-gray-300 leading-relaxed">{error}</p>
          </div>
        ) : null}

        {/* Empty state */}
        {!isLoading && !error && !result ? (
          <div className="flex-1 flex flex-col justify-center rounded-lg border border-dashed border-white/[0.08] p-6">
            <p className="font-heading text-lg font-semibold text-white mb-2">
              Ready to inspect failures
            </p>
            <p className="font-mono text-xs text-gray-500 leading-relaxed max-w-md">
              Paste logs or select a failed GitHub Actions run. You'll get a root cause,
              summary, and fix suggestion — plus similar historical failures from the RAG store.
            </p>
          </div>
        ) : null}

        {/* Results */}
        {!isLoading && !error && result ? (
          <div className="grid gap-3">
            {sections.map((section) => (
              <article key={section.key} className={`accent-card ${section.accentClass} p-4`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-mono text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      {section.title}
                    </h2>
                    <p className="text-sm text-gray-200 leading-relaxed">{section.value}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => copyText(section.key, section.value)}
                    className="btn-ghost text-[10px] shrink-0"
                  >
                    {copiedLabel === section.key ? "✓" : "copy"}
                  </button>
                </div>
              </article>
            ))}

            <SimilarFailures failures={result.similar_failures} />
          </div>
        ) : null}

      </div>
    </section>
  )
}

export default AnalysisPanel
