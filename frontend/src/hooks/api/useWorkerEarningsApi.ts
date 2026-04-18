import { useShallow } from 'zustand/react/shallow'
import { useWorkerEarningsStore } from '../../store/workerEarningsStore'

export const useWorkerEarningsApi = () =>
  useWorkerEarningsStore(
    useShallow((state) => ({
      shifts: state.shifts,
      pagination: state.pagination,
      isLoading: state.isLoading,
      isSubmitting: state.isSubmitting,
      error: state.error,
      notice: state.notice,
      lastImportSummary: state.lastImportSummary,
      screenshotCache: state.screenshotCache,
      fetchShifts: state.fetchShifts,
      createShift: state.createShift,
      updateShift: state.updateShift,
      deleteShift: state.deleteShift,
      importShiftsCsv: state.importShiftsCsv,
      downloadImportTemplate: state.downloadImportTemplate,
      uploadShiftScreenshot: state.uploadShiftScreenshot,
      setCachedScreenshot: state.setCachedScreenshot,
      clearNotice: state.clearNotice,
      clearError: state.clearError,
    })),
  )
