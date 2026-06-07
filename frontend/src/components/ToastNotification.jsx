import { useState, useEffect } from "react"

function ToastNotification({ message, type = "success", onClose, duration = 4000 }) {
  const [progress, setProgress] = useState(100)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))

    const startTime = Date.now()
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
      setProgress(remaining)
      if (remaining <= 0) {
        clearInterval(interval)
        setIsVisible(false)
        setTimeout(onClose, 200)
      }
    }, 50)

    return () => clearInterval(interval)
  }, [duration, onClose])

  const borderColors = {
    success: "border-l-emerald-500",
    error: "border-l-red-500",
    info: "border-l-blue-500",
  }

  const barColors = {
    success: "bg-emerald-500",
    error: "bg-red-500",
    info: "bg-blue-500",
  }

  return (
    <div
      className={`fixed right-4 top-4 z-50 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-md border border-white/[0.08] border-l-[3px] ${borderColors[type] || borderColors.info} bg-surface-raised shadow-2xl transition-all duration-200 ${
        isVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between p-3">
        <p className="font-mono text-xs text-gray-300">{message}</p>
        <button
          onClick={() => {
            setIsVisible(false)
            setTimeout(onClose, 200)
          }}
          className="ml-3 text-gray-600 transition hover:text-gray-300"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="h-px w-full bg-white/[0.04]">
        <div
          className={`h-full ${barColors[type] || barColors.info} transition-all duration-100 ease-linear`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}

export default ToastNotification
