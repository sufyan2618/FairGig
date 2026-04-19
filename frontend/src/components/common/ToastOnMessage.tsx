import { useEffect, useRef } from 'react'
import { useToastStore, type ToastTone } from '../../store/toastStore'

interface ToastOnMessageProps {
  message: string | null | undefined
  tone: ToastTone
  title?: string
  durationMs?: number
  onShown?: () => void
}

export const ToastOnMessage = ({ message, tone, title, durationMs, onShown }: ToastOnMessageProps) => {
  const showToast = useToastStore((state) => state.showToast)
  const lastMessageRef = useRef<string | null>(null)

  useEffect(() => {
    const nextMessage = message?.trim() ?? ''

    if (!nextMessage) {
      lastMessageRef.current = null
      return
    }

    if (lastMessageRef.current === nextMessage) {
      return
    }

    lastMessageRef.current = nextMessage
    showToast({
      message: nextMessage,
      tone,
      title,
      durationMs,
    })

    if (onShown) {
      onShown()
    }
  }, [durationMs, message, onShown, showToast, title, tone])

  return null
}
