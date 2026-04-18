import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { workerEarningsApi, type ListShiftsParams } from '../api/workerEarningsApi'
import type {
  CreateShiftPayload,
  CsvImportSummaryResponse,
  PaginationMeta,
  ShiftScreenshotResponse,
  UpdateShiftPayload,
  WorkerShift,
} from '../types/worker'

interface WorkerEarningsState {
  shifts: WorkerShift[]
  pagination: PaginationMeta
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  notice: string | null
  lastImportSummary: CsvImportSummaryResponse['summary'] | null
  screenshotCache: Record<string, string>
  fetchShifts: (params?: ListShiftsParams) => Promise<void>
  createShift: (payload: CreateShiftPayload, screenshotFile?: File | null) => Promise<WorkerShift>
  updateShift: (shiftId: string, payload: UpdateShiftPayload) => Promise<WorkerShift>
  deleteShift: (shiftId: string) => Promise<void>
  importShiftsCsv: (file: File) => Promise<CsvImportSummaryResponse['summary']>
  downloadImportTemplate: () => Promise<Blob>
  uploadShiftScreenshot: (shiftId: string, file: File) => Promise<ShiftScreenshotResponse>
  setCachedScreenshot: (shiftId: string, dataUrl: string) => void
  clearNotice: () => void
  clearError: () => void
}

const defaultPagination: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  total_pages: 0,
}

const toDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '')
    reader.onerror = () => reject(new Error('Unable to read screenshot file.'))
    reader.readAsDataURL(file)
  })

const upsertShift = (shifts: WorkerShift[], updated: WorkerShift): WorkerShift[] => {
  const index = shifts.findIndex((item) => item.id === updated.id)
  if (index === -1) {
    return [updated, ...shifts]
  }

  const cloned = [...shifts]
  cloned[index] = updated
  return cloned
}

export const useWorkerEarningsStore = create<WorkerEarningsState>()(
  persist(
    (set, get) => ({
      shifts: [],
      pagination: defaultPagination,
      isLoading: false,
      isSubmitting: false,
      error: null,
      notice: null,
      lastImportSummary: null,
      screenshotCache: {},

      fetchShifts: async (params = {}) => {
        set({ isLoading: true, error: null })
        try {
          const response = await workerEarningsApi.listShifts(params)
          set({
            shifts: response.data,
            pagination: response.pagination,
            isLoading: false,
          })
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unable to load shifts.',
          })
          throw error
        }
      },

      createShift: async (payload, screenshotFile) => {
        set({ isSubmitting: true, error: null, notice: null })
        try {
          const created = await workerEarningsApi.createShift(payload)
          let shift = created.data

          if (screenshotFile) {
            const uploaded = await workerEarningsApi.uploadShiftScreenshot(shift.id, screenshotFile)
            shift = uploaded.data
            const dataUrl = await toDataUrl(screenshotFile)
            if (dataUrl) {
              set((state) => ({
                screenshotCache: {
                  ...state.screenshotCache,
                  [shift.id]: dataUrl,
                },
              }))
            }
          }

          set((state) => ({
            shifts: upsertShift(state.shifts, shift),
            isSubmitting: false,
            notice: screenshotFile
              ? 'Shift created and screenshot uploaded successfully.'
              : 'Shift created successfully.',
          }))

          return shift
        } catch (error) {
          set({
            isSubmitting: false,
            error: error instanceof Error ? error.message : 'Unable to create shift.',
          })
          throw error
        }
      },

      updateShift: async (shiftId, payload) => {
        set({ isSubmitting: true, error: null, notice: null })
        try {
          const updated = await workerEarningsApi.updateShift(shiftId, payload)
          set((state) => ({
            shifts: upsertShift(state.shifts, updated.data),
            isSubmitting: false,
            notice: 'Shift updated successfully.',
          }))

          return updated.data
        } catch (error) {
          set({
            isSubmitting: false,
            error: error instanceof Error ? error.message : 'Unable to update shift.',
          })
          throw error
        }
      },

      deleteShift: async (shiftId) => {
        set({ isSubmitting: true, error: null, notice: null })
        try {
          await workerEarningsApi.deleteShift(shiftId)
          set((state) => ({
            shifts: state.shifts.filter((shift) => shift.id !== shiftId),
            isSubmitting: false,
            notice: 'Shift deleted successfully.',
          }))
        } catch (error) {
          set({
            isSubmitting: false,
            error: error instanceof Error ? error.message : 'Unable to delete shift.',
          })
          throw error
        }
      },

      importShiftsCsv: async (file) => {
        set({ isSubmitting: true, error: null, notice: null })
        try {
          const response = await workerEarningsApi.importShiftsCsv(file)
          await get().fetchShifts({ page: 1, limit: get().pagination.limit || 20 })
          set({
            isSubmitting: false,
            lastImportSummary: response.summary,
            notice: `Imported ${response.summary.imported} of ${response.summary.total_rows} row(s).`,
          })
          return response.summary
        } catch (error) {
          set({
            isSubmitting: false,
            error: error instanceof Error ? error.message : 'Unable to import CSV.',
          })
          throw error
        }
      },

      downloadImportTemplate: async () => {
        try {
          return await workerEarningsApi.downloadImportTemplate()
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Unable to download template.',
          })
          throw error
        }
      },

      uploadShiftScreenshot: async (shiftId, file) => {
        set({ isSubmitting: true, error: null, notice: null })
        try {
          const response = await workerEarningsApi.uploadShiftScreenshot(shiftId, file)
          const dataUrl = await toDataUrl(file)

          set((state) => ({
            shifts: upsertShift(state.shifts, response.data),
            screenshotCache: dataUrl
              ? {
                  ...state.screenshotCache,
                  [shiftId]: dataUrl,
                }
              : state.screenshotCache,
            isSubmitting: false,
            notice: 'Screenshot uploaded successfully.',
          }))

          return {
            shift_id: response.data.id,
            verification_status: response.data.verification_status,
            screenshot_url: response.data.screenshot_url ?? '',
          }
        } catch (error) {
          set({
            isSubmitting: false,
            error: error instanceof Error ? error.message : 'Unable to upload screenshot.',
          })
          throw error
        }
      },

      setCachedScreenshot: (shiftId, dataUrl) => {
        set((state) => ({
          screenshotCache: {
            ...state.screenshotCache,
            [shiftId]: dataUrl,
          },
        }))
      },

      clearNotice: () => set({ notice: null }),
      clearError: () => set({ error: null }),
    }),
    {
      name: 'fairgig-worker-earnings-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        screenshotCache: state.screenshotCache,
      }),
    },
  ),
)
