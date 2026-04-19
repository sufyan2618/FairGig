import { authenticatedRequest } from './authenticatedRequest'
import type {
  CreateGrievancePayload,
  GrievanceItemResponse,
  GrievanceListResponse,
} from '../types/worker'

const GRIEVANCE_PREFIX = '/api/grievances'

export interface ListGrievancesParams {
  page?: number
  limit?: number
  platform?: string
  category?: string
  escalation_status?: string
  cluster_id?: string
  tag?: string
}

const removeEmptyParams = (params: ListGrievancesParams): Record<string, string | number> => {
  const cleaned: Record<string, string | number> = {}
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }
    cleaned[key] = value
  }
  return cleaned
}

export const workerGrievanceApi = {
  listComplaints: async (params: ListGrievancesParams = {}): Promise<GrievanceListResponse> => {
    const response = await authenticatedRequest<GrievanceListResponse>(
      {
        method: 'GET',
        url: `${GRIEVANCE_PREFIX}/`,
        params: removeEmptyParams(params),
      },
      'Unable to load grievances right now.',
    )

    return response.data
  },

  createComplaint: async (payload: CreateGrievancePayload): Promise<GrievanceItemResponse> => {
    const response = await authenticatedRequest<GrievanceItemResponse>(
      {
        method: 'POST',
        url: `${GRIEVANCE_PREFIX}`,
        data: payload,
      },
      'Unable to post grievance right now.',
    )

    return response.data
  },

  deleteComplaint: async (complaintId: string): Promise<{ message: string }> => {
    const response = await authenticatedRequest<{ message: string }>(
      {
        method: 'DELETE',
        url: `${GRIEVANCE_PREFIX}/${complaintId}`,
      },
      'Unable to delete grievance right now.',
    )

    return response.data
  },
}
