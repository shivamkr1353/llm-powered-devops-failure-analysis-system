function LoadingState({ message = "Loading...", submessage = "" }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-white/[0.08] bg-surface-raised p-8 text-center">
      <div className="w-48 scan-line" />
      <div>
        <h2 className="font-heading text-base font-semibold text-white">{message}</h2>
        {submessage ? (
          <p className="mt-1.5 font-mono text-xs text-gray-500">{submessage}</p>
        ) : null}
      </div>
    </div>
  )
}

export default LoadingState
