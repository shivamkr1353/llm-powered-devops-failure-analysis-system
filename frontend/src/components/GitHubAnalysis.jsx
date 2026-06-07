import { useState } from "react"
import RepoSelector from "./RepoSelector"
import WorkflowStats from "./WorkflowStats"
import FailedRunsTable from "./FailedRunsTable"
import AnalysisPanel from "./AnalysisPanel"
import ErrorState from "./ErrorState"
import { fetchFailedRuns, analyzeRun } from "../api"

function GitHubAnalysis() {
  const [owner, setOwner] = useState("")
  const [repo, setRepo] = useState("")
  const [runsData, setRunsData] = useState(null)
  const [fetchError, setFetchError] = useState("")
  const [isFetching, setIsFetching] = useState(false)

  const [analysisResult, setAnalysisResult] = useState(null)
  const [analysisError, setAnalysisError] = useState("")
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analyzingRunId, setAnalyzingRunId] = useState(null)

  const handleFetchRuns = async () => {
    if (!owner.trim() || !repo.trim()) return

    setIsFetching(true)
    setFetchError("")
    setRunsData(null)
    setAnalysisResult(null)
    setAnalysisError("")

    try {
      const data = await fetchFailedRuns(owner.trim(), repo.trim())
      setRunsData(data)
    } catch (err) {
      setFetchError(err.message || "Failed to fetch workflow runs.")
    } finally {
      setIsFetching(false)
    }
  }

  const handleAnalyzeRun = async (runId) => {
    setIsAnalyzing(true)
    setAnalyzingRunId(runId)
    setAnalysisResult(null)
    setAnalysisError("")

    try {
      const result = await analyzeRun(owner.trim(), repo.trim(), runId)
      setAnalysisResult(result)
    } catch (err) {
      setAnalysisError(err.message || "Failed to analyze workflow run.")
    } finally {
      setIsAnalyzing(false)
      setAnalyzingRunId(null)
    }
  }

  return (
    <div className="grid gap-4">
      <RepoSelector
        owner={owner}
        repo={repo}
        onOwnerChange={setOwner}
        onRepoChange={setRepo}
        onFetch={handleFetchRuns}
        isLoading={isFetching}
      />

      {fetchError ? (
        <ErrorState message={fetchError} onRetry={handleFetchRuns} />
      ) : null}

      {runsData ? (
        <div className="grid gap-4">
          <WorkflowStats
            totalRuns={runsData.total_runs}
            failedRuns={runsData.failed_runs}
            successRate={runsData.success_rate}
          />

          <div className="panel p-5">
            <div className="mb-4">
              <span className="tag">FAILED RUNS</span>
            </div>
            <FailedRunsTable
              runs={runsData.runs}
              onAnalyze={handleAnalyzeRun}
              analyzingRunId={analyzingRunId}
            />
          </div>
        </div>
      ) : null}

      {(isAnalyzing || analysisResult || analysisError) ? (
        <AnalysisPanel
          result={analysisResult}
          isLoading={isAnalyzing}
          error={analysisError}
          loadingMessage="Analyzing GitHub Actions failure"
        />
      ) : null}
    </div>
  )
}

export default GitHubAnalysis
