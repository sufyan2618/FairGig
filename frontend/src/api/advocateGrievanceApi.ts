import { authenticatedRequest } from './authenticatedRequest'
import type {
  AdvocateClusterSummary,
  AdvocateClusterUpdatePayload,
  AdvocateComplaintFilters,
  AdvocateComplaintItemResponse,
  AdvocateComplaintListResponse,
  AdvocateComplaintsByPlatformItem,
  AdvocateEscalationRatio,
  AdvocateStatusUpdatePayload,
  AdvocateSuggestClustersResponse,
  AdvocateTagsUpdatePayload,
  AdvocateTopCategory,
} from '../types/advocate'

const GRIEVANCE_PREFIX = '/api/grievances'

const removeEmptyParams = (
  params: Record<string, string | number | undefined>,
): Record<string, string | number> => {
  const cleaned: Record<string, string | number> = {}

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') {
      continue
    }

    cleaned[key] = value
  }

  return cleaned
}

export interface ClusterComplaintsParams {
  page?: number
  limit?: number
  platform?: string
  category?: string
  escalation_status?: string
  tag?: string
}

export interface ComplaintsByPlatformParams {
  date_from?: string
  date_to?: string
}

export const advocateGrievanceApi = {
  listComplaints: async (
    params: AdvocateComplaintFilters = {},
  ): Promise<AdvocateComplaintListResponse> => {
    const response = await authenticatedRequest<AdvocateComplaintListResponse>(
      {
        method: 'GET',
        url: `${GRIEVANCE_PREFIX}/`,
        params: removeEmptyParams({
          page: params.page,
          limit: params.limit,
          platform: params.platform,
          category: params.category,
          escalation_status: params.escalation_status,
          cluster_id: params.cluster_id,
          tag: params.tag,
        }),
      },
      'Unable to load complaints right now.',
    )

    return response.data
  },

  updateTags: async (
    complaintId: string,
    payload: AdvocateTagsUpdatePayload,
  ): Promise<AdvocateComplaintItemResponse> => {
    const response = await authenticatedRequest<AdvocateComplaintItemResponse>(
      {
        method: 'PUT',
        url: `${GRIEVANCE_PREFIX}/${complaintId}/tags`,
        data: payload,
      },
      'Unable to update complaint tags right now.',
    )

    return response.data
  },

  updateStatus: async (
    complaintId: string,
    payload: AdvocateStatusUpdatePayload,
  ): Promise<AdvocateComplaintItemResponse> => {
    const response = await authenticatedRequest<AdvocateComplaintItemResponse>(
      {
        method: 'PUT',
        url: `${GRIEVANCE_PREFIX}/${complaintId}/status`,
        data: payload,
      },
      'Unable to update complaint status right now.',
    )

    return response.data
  },

  updateCluster: async (
    complaintId: string,
    payload: AdvocateClusterUpdatePayload,
  ): Promise<AdvocateComplaintItemResponse> => {
    const response = await authenticatedRequest<AdvocateComplaintItemResponse>(
      {
        method: 'PUT',
        url: `${GRIEVANCE_PREFIX}/${complaintId}/cluster`,
        data: payload,
      },
      'Unable to update complaint cluster right now.',
    )

    return response.data
  },

  listClusters: async (): Promise<AdvocateClusterSummary[]> => {
    const response = await authenticatedRequest<AdvocateClusterSummary[]>(
      {
        method: 'GET',
        url: `${GRIEVANCE_PREFIX}/clusters`,
      },
      'Unable to load clusters right now.',
    )

    return response.data
  },

  listClusterComplaints: async (
    clusterId: string,
    params: ClusterComplaintsParams = {},
  ): Promise<AdvocateComplaintListResponse> => {
    const response = await authenticatedRequest<AdvocateComplaintListResponse>(
      {
        method: 'GET',
        url: `${GRIEVANCE_PREFIX}/clusters/${clusterId}`,
        params: removeEmptyParams({
          page: params.page,
          limit: params.limit,
          platform: params.platform,
          category: params.category,
          escalation_status: params.escalation_status,
          tag: params.tag,
        }),
      },
      'Unable to load cluster complaints right now.',
    )

    return response.data
  },

  suggestClusters: async (complaintIds: string[]): Promise<AdvocateSuggestClustersResponse> => {
    const response = await authenticatedRequest<AdvocateSuggestClustersResponse>(
      {
        method: 'POST',
        url: `${GRIEVANCE_PREFIX}/suggest-clusters`,
        data: {
          complaint_ids: complaintIds,
        },
      },
      'Unable to suggest complaint clusters right now.',
    )

    return response.data
  },

  getTopCategories: async (): Promise<AdvocateTopCategory[]> => {
    const response = await authenticatedRequest<AdvocateTopCategory[]>(
      {
        method: 'GET',
        url: `${GRIEVANCE_PREFIX}/analytics/top-categories`,
      },
      'Unable to load top categories right now.',
    )

    return response.data
  },

  getComplaintsByPlatform: async (
    params: ComplaintsByPlatformParams = {},
  ): Promise<AdvocateComplaintsByPlatformItem[]> => {
    const response = await authenticatedRequest<AdvocateComplaintsByPlatformItem[]>(
      {
        method: 'GET',
        url: `${GRIEVANCE_PREFIX}/analytics/by-platform`,
        params: removeEmptyParams({
          date_from: params.date_from,
          date_to: params.date_to,
        }),
      },
      'Unable to load complaint trend by platform right now.',
    )

    return response.data
  },

  getEscalationRatio: async (): Promise<AdvocateEscalationRatio> => {
    const response = await authenticatedRequest<AdvocateEscalationRatio>(
      {
        method: 'GET',
        url: `${GRIEVANCE_PREFIX}/analytics/escalation-ratio`,
      },
      'Unable to load escalation ratio right now.',
    )

    return response.data
  },
}
