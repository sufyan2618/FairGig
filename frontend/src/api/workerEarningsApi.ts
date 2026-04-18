import { authenticatedRequest } from './authenticatedRequest'
import type {
  CreateShiftPayload,
  CsvImportSummaryResponse,
  ShiftScreenshotResponse,
  UpdateShiftPayload,
  WorkerShiftResponse,
  WorkerShiftsResponse,
} from '../types/worker'

const EARNINGS_PREFIX = '/api/earnings'

export interface ListShiftsParams {
  page?: number
  limit?: number
  platform?: string
  date_from?: string
  date_to?: string
  verification_status?: string
}

const removeEmptyParams = (params: ListShiftsParams): Record<string, string | number> => {
  const cleaned: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }
    cleaned[key] = value
  }
  return cleaned
}

export const workerEarningsApi = {
  listShifts: async (params: ListShiftsParams = {}): Promise<WorkerShiftsResponse> => {
    const response = await authenticatedRequest<WorkerShiftsResponse>(
      {
        method: 'GET',
        url: `${EARNINGS_PREFIX}/shifts`,
        params: removeEmptyParams(params),
      },
      'Unable to load shifts right now.',
    )

    return response.data
  },

  createShift: async (payload: CreateShiftPayload): Promise<WorkerShiftResponse> => {
    const response = await authenticatedRequest<WorkerShiftResponse>(
      {
        method: 'POST',
        url: `${EARNINGS_PREFIX}/shifts`,
        data: payload,
      },
      'Unable to create shift right now.',
    )

    return response.data
  },

  updateShift: async (shiftId: string, payload: UpdateShiftPayload): Promise<WorkerShiftResponse> => {
    const response = await authenticatedRequest<WorkerShiftResponse>(
      {
        method: 'PUT',
        url: `${EARNINGS_PREFIX}/shifts/${shiftId}`,
        data: payload,
      },
      'Unable to update shift right now.',
    )

    return response.data
  },

  deleteShift: async (shiftId: string): Promise<{ message: string }> => {
    const response = await authenticatedRequest<{ message: string }>(
      {
        method: 'DELETE',
        url: `${EARNINGS_PREFIX}/shifts/${shiftId}`,
      },
      'Unable to delete shift right now.',
    )

    return response.data
  },

  importShiftsCsv: async (file: File): Promise<CsvImportSummaryResponse> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await authenticatedRequest<CsvImportSummaryResponse>(
      {
        method: 'POST',
        url: `${EARNINGS_PREFIX}/shifts/import`,
        data: formData,
      },
      'Unable to import CSV right now.',
    )

    return response.data
  },

  downloadImportTemplate: async (): Promise<Blob> => {
    const response = await authenticatedRequest<Blob>(
      {
        method: 'GET',
        url: `${EARNINGS_PREFIX}/shifts/import/template`,
        responseType: 'blob',
      },
      'Unable to download CSV template right now.',
    )

    return response.data
  },

  uploadShiftScreenshot: async (shiftId: string, screenshot: File): Promise<WorkerShiftResponse> => {
    const formData = new FormData()
    formData.append('screenshot', screenshot)

    const response = await authenticatedRequest<WorkerShiftResponse>(
      {
        method: 'POST',
        url: `${EARNINGS_PREFIX}/shifts/${shiftId}/screenshot`,
        data: formData,
      },
      'Unable to upload screenshot right now.',
    )

    return response.data
  },

  getShiftScreenshot: async (shiftId: string): Promise<ShiftScreenshotResponse> => {
    const response = await authenticatedRequest<ShiftScreenshotResponse>(
      {
        method: 'GET',
        url: `${EARNINGS_PREFIX}/shifts/${shiftId}/screenshot`,
      },
      'Unable to load screenshot right now.',
    )

    return response.data
  },
}
