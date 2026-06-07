function ErrorState({ message = "Something went wrong.", onRetry = null }) {
  return (
    <div className="accent-card accent-card--red p-5">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 font-mono text-xs font-bold text-red-400">ERR</span>
        <div className="flex-1">
          <p className="text-sm text-gray-300 leading-relaxed">{message}</p>
          {onRetry ? (
            <button
              type="button"
              onClick={onRetry}
              className="btn-ghost mt-3 text-[11px]"
            >
              retry
            </button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export default ErrorState
