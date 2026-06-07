import { useState } from "react"
import LogInput from "./LogInput"
import AnalysisPanel from "./AnalysisPanel"
import { sampleLogs } from "../data/sampleLogs"
import { analyzeManual } from "../api"

const parsedMaxLogChars = Number(import.meta.env.VITE_MAX_LOG_CHARS)
const MAX_LOG_CHARS = Number.isFinite(parsedMaxLogChars) && parsedMaxLogChars > 0 ? parsedMaxLogChars : 20000

function ManualAnalysis() {
  const [logs, setLogs] = useState(sampleLogs[0].logs)
  const [result, setResult] = useState(null)
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleAnalyze = async () => {
    const trimmedLogs = logs.trim()

    if (!trimmedLogs) {
      setError("Paste CI/CD logs before running an analysis.")
      setResult(null)
      return
    }

    if (trimmedLogs.length > MAX_LOG_CHARS) {
      setError(`Logs cannot exceed ${MAX_LOG_CHARS.toLocaleString()} characters.`)
      setResult(null)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const payload = await analyzeManual(trimmedLogs)
      setResult(payload)
    } catch (requestError) {
      setResult(null)
      setError(
        requestError.message ||
          "Something went wrong while calling the API. Check that the backend is running and reachable."
      )
    } finally {
      setIsLoading(false)
    }
  }

  const loadExample = (exampleLogs) => {
    setLogs(exampleLogs)
    setResult(null)
    setError("")
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.2fr_0.9fr]">
      <LogInput
        logs={logs}
        onLogsChange={setLogs}
        onAnalyze={handleAnalyze}
        isLoading={isLoading}
        maxLogChars={MAX_LOG_CHARS}
        examples={sampleLogs}
        onLoadExample={loadExample}
      />
      <AnalysisPanel result={result} isLoading={isLoading} error={error} />
    </div>
  )
}

export default ManualAnalysis
