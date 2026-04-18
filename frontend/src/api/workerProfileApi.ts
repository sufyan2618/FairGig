import { authenticatedRequest } from './authenticatedRequest'
import type { AuthUser, BasicMessageResponse } from '../types/auth'
import type { WorkerChangePasswordPayload, WorkerProfileUpdatePayload } from '../types/worker'

const AUTH_PREFIX = '/api/auth'

export const workerProfileApi = {
  getProfile: async (): Promise<AuthUser> => {
    const response = await authenticatedRequest<AuthUser>(
      {
        method: 'GET',
        url: `${AUTH_PREFIX}/me`,
      },
      'Unable to load profile right now.',
    )

    return response.data
  },

  updateProfile: async (payload: WorkerProfileUpdatePayload): Promise<AuthUser> => {
    const response = await authenticatedRequest<AuthUser>(
      {
        method: 'PATCH',
        url: `${AUTH_PREFIX}/me`,
        data: payload,
      },
      'Unable to update profile right now.',
    )

    return response.data
  },

  changePassword: async (payload: WorkerChangePasswordPayload): Promise<BasicMessageResponse> => {
    const response = await authenticatedRequest<BasicMessageResponse>(
      {
        method: 'POST',
        url: `${AUTH_PREFIX}/change-password`,
        data: payload,
      },
      'Unable to change password right now.',
    )

    return response.data
  },
}
