import { useEffect } from 'react'
import { useToastStore, type ToastTone } from '../../store/toastStore'
import { classNames } from '../../utils/functions'

const TONE_STYLES: Record<ToastTone, { ring: string; dot: string; label: string }> = {
  success: {
    ring: 'border-emerald-200/80 bg-white/95 text-emerald-950',
    dot: 'bg-emerald-500',
    label: 'Success',
  },
  error: {
    ring: 'border-rose-200/80 bg-white/95 text-rose-950',
    dot: 'bg-rose-500',
    label: 'Error',
  },
  warning: {
    ring: 'border-amber-200/80 bg-white/95 text-amber-950',
    dot: 'bg-amber-500',
    label: 'Warning',
  },
  info: {
    ring: 'border-sky-200/80 bg-white/95 text-slate-900',
    dot: 'bg-sky-500',
    label: 'Info',
  },
}

interface ToastItemProps {
  id: string
  title?: string
  message: string
  tone: ToastTone
  durationMs: number
}

const ToastItem = ({ id, title, message, tone, durationMs }: ToastItemProps) => {
  const dismissToast = useToastStore((state) => state.dismissToast)
  const toneStyle = TONE_STYLES[tone]

  useEffect(() => {
    const timeout = window.setTimeout(() => dismissToast(id), durationMs)
    return () => window.clearTimeout(timeout)
  }, [dismissToast, durationMs, id])

  return (
    <div
      className={classNames(
        'pointer-events-auto w-full overflow-hidden rounded-2xl border px-4 py-3 shadow-[0_16px_40px_-24px_rgba(2,6,23,0.45)] backdrop-blur-sm',
        'transition-transform duration-200 ease-out animate-toast-in',
        toneStyle.ring,
      )}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className={classNames('mt-1 h-2.5 w-2.5 shrink-0 rounded-full', toneStyle.dot)} aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-75">{title ?? toneStyle.label}</p>
          <p className="mt-1 text-sm font-medium leading-5 wrap-break-word">{message}</p>
        </div>
        <button
          type="button"
          onClick={() => dismissToast(id)}
          className="ml-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-800"
          aria-label="Dismiss notification"
        >
          Close
        </button>
      </div>
      <div className="mt-3 h-1 overflow-hidden rounded-full bg-slate-200/70">
        <div
          className={classNames('h-full rounded-full animate-toast-progress', toneStyle.dot)}
          style={{ animationDuration: `${durationMs}ms` }}
        />
      </div>
    </div>
  )
}

export const ToastViewport = () => {
  const toasts = useToastStore((state) => state.toasts)

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="pointer-events-none fixed inset-x-3 top-3 z-90 sm:inset-x-auto sm:right-4 sm:top-4 sm:w-[min(92vw,26rem)]">
      <div className="flex max-h-[calc(100vh-1.5rem)] flex-col gap-2.5 overflow-y-auto pr-0.5 sm:max-h-[calc(100vh-2rem)]">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            id={toast.id}
            title={toast.title}
            message={toast.message}
            tone={toast.tone}
            durationMs={toast.durationMs}
          />
        ))}
      </div>
    </div>
  )
}
