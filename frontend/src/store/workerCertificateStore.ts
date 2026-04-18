import { create } from 'zustand'
import { workerCertificateApi } from '../api/workerCertificateApi'

interface WorkerCertificateState {
  html: string | null
  isLoading: boolean
  error: string | null
  lastRange: {
    dateFrom: string | null
    dateTo: string | null
  }
  generateCertificate: (dateFrom?: string, dateTo?: string) => Promise<string>
  clearCertificate: () => void
  clearError: () => void
}

export const useWorkerCertificateStore = create<WorkerCertificateState>((set) => ({
  html: null,
  isLoading: false,
  error: null,
  lastRange: {
    dateFrom: null,
    dateTo: null,
  },

  generateCertificate: async (dateFrom, dateTo) => {
    set({ isLoading: true, error: null })
    try {
      const html = await workerCertificateApi.renderCertificateHtml(dateFrom, dateTo)
      set({
        html,
        isLoading: false,
        lastRange: {
          dateFrom: dateFrom ?? null,
          dateTo: dateTo ?? null,
        },
      })
      return html
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unable to generate certificate.',
      })
      throw error
    }
  },

  clearCertificate: () =>
    set({
      html: null,
      lastRange: {
        dateFrom: null,
        dateTo: null,
      },
    }),

  clearError: () => set({ error: null }),
}))
