import { authenticatedRequest } from './authenticatedRequest'
import type { WorkerMedianResponse, WorkerPlatformsResponse } from '../types/worker'

const ANALYTICS_PREFIX = '/api/analytics'

export const workerAnalyticsApi = {
  getWorkerMedian: async (category: string, cityZone: string, month?: string): Promise<WorkerMedianResponse> => {
    const response = await authenticatedRequest<WorkerMedianResponse>(
      {
        method: 'GET',
        url: `${ANALYTICS_PREFIX}/worker/median`,
        params: {
          category,
          city_zone: cityZone,
          month,
        },
      },
      'Unable to load city median right now.',
    )

    return response.data
  },

  getPlatforms: async (): Promise<WorkerPlatformsResponse> => {
    const response = await authenticatedRequest<WorkerPlatformsResponse>(
      {
        method: 'GET',
        url: `${ANALYTICS_PREFIX}/platforms`,
      },
      'Unable to load platform list right now.',
    )

    return response.data
  },
}
