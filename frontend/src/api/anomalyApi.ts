import { authenticatedRequest } from './authenticatedRequest'
import type { ChatRequest, ChatResponse, DetectResponse, EarningsHistoryPayload } from '../types/anomaly'

const ANOMALY_PREFIX = '/api/anomaly'

export const anomalyApi = {
  detect: async (payload: EarningsHistoryPayload): Promise<DetectResponse> => {
    const response = await authenticatedRequest<DetectResponse>(
      {
        method: 'POST',
        url: `${ANOMALY_PREFIX}/detect`,
        data: payload,
      },
      'Unable to analyze anomalies right now.',
    )

    return response.data
  },

  chat: async (payload: ChatRequest): Promise<ChatResponse> => {
    const response = await authenticatedRequest<ChatResponse>(
      {
        method: 'POST',
        url: `${ANOMALY_PREFIX}/chat`,
        data: payload,
      },
      'Unable to reach the AI assistant right now.',
    )

    return response.data
  },
}
