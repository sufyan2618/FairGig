import { create } from 'zustand'

export type ToastTone = 'success' | 'error' | 'warning' | 'info'

export interface ToastItem {
  id: string
  message: string
  title?: string
  tone: ToastTone
  durationMs: number
}

interface ShowToastPayload {
  message: string
  title?: string
  tone?: ToastTone
  durationMs?: number
}

interface ToastStoreState {
  toasts: ToastItem[]
  showToast: (payload: ShowToastPayload) => string
  dismissToast: (id: string) => void
  clearToasts: () => void
}

const MAX_TOASTS = 5
const DEFAULT_DURATION_MS = 4200

const createToastId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`

export const useToastStore = create<ToastStoreState>((set) => ({
  toasts: [],

  showToast: ({ message, title, tone = 'info', durationMs = DEFAULT_DURATION_MS }) => {
    const trimmedMessage = message.trim()

    if (!trimmedMessage) {
      return ''
    }

    const id = createToastId()
    const nextToast: ToastItem = {
      id,
      message: trimmedMessage,
      title,
      tone,
      durationMs,
    }

    set((state) => {
      const nextToasts = [...state.toasts, nextToast]
      return {
        toasts: nextToasts.slice(Math.max(0, nextToasts.length - MAX_TOASTS)),
      }
    })

    return id
  },

  dismissToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    }))
  },

  clearToasts: () => set({ toasts: [] }),
}))
