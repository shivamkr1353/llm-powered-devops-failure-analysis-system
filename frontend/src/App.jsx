import { useState, useRef, useEffect } from "react"
import ManualAnalysis from "./components/ManualAnalysis"
import GitHubAnalysis from "./components/GitHubAnalysis"
import FailureHistory from "./components/FailureHistory"

const TABS = [
  { id: "manual", label: "Manual Analysis" },
  { id: "github", label: "GitHub Actions" },
  { id: "history", label: "Failure History" },
]

function App() {
  const [activeTab, setActiveTab] = useState("manual")
  const [indicatorStyle, setIndicatorStyle] = useState({})
  const tabRefs = useRef({})

  // Sliding bottom-border indicator
  useEffect(() => {
    const el = tabRefs.current[activeTab]
    if (el) {
      setIndicatorStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      })
    }
  }, [activeTab])

  return (
    <main className="min-h-screen px-4 py-8 text-gray-300 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">

        {/* ── Header ──────────────────────────────── */}
        <header className="mb-10">
          <div className="flex items-center gap-3 mb-1">
            <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(34,197,94,0.4)]" />
            <span className="font-mono text-[11px] text-gray-500 tracking-wide">SYSTEM ONLINE</span>
          </div>
          <h1 className="font-heading text-3xl font-bold text-white sm:text-4xl lg:text-5xl tracking-tight">
            DevOps Failure{" "}
            <span className="text-accent">Analysis</span>
          </h1>
          <p className="mt-3 max-w-xl font-mono text-sm text-gray-500 leading-relaxed">
            Paste failing CI/CD logs, connect GitHub Actions, or browse past incidents.
            AI diagnosis with RAG-powered similar failure retrieval.
          </p>
        </header>

        {/* ── Tab Navigation ──────────────────────── */}
        <nav className="mb-8 relative">
          <div className="flex gap-0 border-b border-white/[0.08]">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                ref={(el) => { tabRefs.current[tab.id] = el }}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`relative px-5 py-3 font-mono text-sm font-medium transition-colors duration-200 ${
                  activeTab === tab.id
                    ? "text-accent-text"
                    : "text-gray-500 hover:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
            {/* Sliding indicator */}
            <div
              className="absolute bottom-0 h-[2px] bg-accent transition-all duration-300 ease-out"
              style={indicatorStyle}
            />
          </div>
        </nav>

        {/* ── Tab Content ─────────────────────────── */}
        <div className="min-h-[500px] animate-fade-in" key={activeTab}>
          {activeTab === "manual" ? <ManualAnalysis /> : null}
          {activeTab === "github" ? <GitHubAnalysis /> : null}
          {activeTab === "history" ? <FailureHistory /> : null}
        </div>

        {/* ── Footer ──────────────────────────────── */}
        <footer className="mt-16 border-t border-white/[0.06] pt-5 flex justify-between items-center">
          <p className="font-mono text-[11px] text-gray-600">
            © {new Date().getFullYear()} DevOps Failure Analysis
          </p>
          <p className="font-mono text-[11px] text-gray-600">
            built by <span className="text-accent-text font-semibold">Shivam Kumar</span>
          </p>
        </footer>

      </div>
    </main>
  )
}

export default App
