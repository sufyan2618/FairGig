import { create } from 'zustand'
import {
  advocateGrievanceApi,
  type ClusterComplaintsParams,
  type ComplaintsByPlatformParams,
} from '../api/advocateGrievanceApi'
import type {
  AdvocateClusterSummary,
  AdvocateClusterUpdatePayload,
  AdvocateComplaint,
  AdvocateComplaintFilters,
  AdvocateComplaintsByPlatformItem,
  AdvocateEscalationRatio,
  AdvocateStatusUpdatePayload,
  AdvocateSuggestedCluster,
  AdvocateTagsUpdatePayload,
  AdvocateTopCategory,
} from '../types/advocate'
import type { PaginationMeta } from '../types/worker'

interface AdvocateGrievanceState {
  complaints: AdvocateComplaint[]
  pagination: PaginationMeta
  clusters: AdvocateClusterSummary[]
  clusterComplaints: AdvocateComplaint[]
  clusterComplaintsPagination: PaginationMeta
  suggestedClusters: AdvocateSuggestedCluster[]
  topCategories: AdvocateTopCategory[]
  complaintsByPlatform: AdvocateComplaintsByPlatformItem[]
  escalationRatio: AdvocateEscalationRatio | null
  isComplaintsLoading: boolean
  isClustersLoading: boolean
  isClusterComplaintsLoading: boolean
  isMutating: boolean
  isAnalyticsLoading: boolean
  error: string | null
  notice: string | null
  fetchComplaints: (filters?: AdvocateComplaintFilters) => Promise<void>
  fetchClusters: () => Promise<void>
  fetchClusterComplaints: (clusterId: string, params?: ClusterComplaintsParams) => Promise<void>
  suggestClusters: (complaintIds: string[]) => Promise<AdvocateSuggestedCluster[]>
  updateTags: (complaintId: string, payload: AdvocateTagsUpdatePayload) => Promise<void>
  updateStatus: (complaintId: string, payload: AdvocateStatusUpdatePayload) => Promise<void>
  updateCluster: (complaintId: string, payload: AdvocateClusterUpdatePayload) => Promise<void>
  fetchTopCategories: () => Promise<void>
  fetchComplaintsByPlatform: (params?: ComplaintsByPlatformParams) => Promise<void>
  fetchEscalationRatio: () => Promise<void>
  fetchComplaintAnalytics: (params?: ComplaintsByPlatformParams) => Promise<void>
  clearError: () => void
  clearNotice: () => void
}

const defaultPagination: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  total_pages: 0,
}

const upsertComplaint = (
  complaints: AdvocateComplaint[],
  updatedComplaint: AdvocateComplaint,
): AdvocateComplaint[] => {
  const index = complaints.findIndex((item) => item.id === updatedComplaint.id)

  if (index === -1) {
    return complaints
  }

  const cloned = [...complaints]
  cloned[index] = updatedComplaint
  return cloned
}

export const useAdvocateGrievanceStore = create<AdvocateGrievanceState>((set) => ({
  complaints: [],
  pagination: defaultPagination,
  clusters: [],
  clusterComplaints: [],
  clusterComplaintsPagination: defaultPagination,
  suggestedClusters: [],
  topCategories: [],
  complaintsByPlatform: [],
  escalationRatio: null,
  isComplaintsLoading: false,
  isClustersLoading: false,
  isClusterComplaintsLoading: false,
  isMutating: false,
  isAnalyticsLoading: false,
  error: null,
  notice: null,

  fetchComplaints: async (filters = {}) => {
    set({ isComplaintsLoading: true, error: null })

    try {
      const response = await advocateGrievanceApi.listComplaints(filters)
      set({
        complaints: response.data,
        pagination: response.pagination,
        isComplaintsLoading: false,
      })
    } catch (error) {
      set({
        isComplaintsLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load complaints.',
      })
      throw error
    }
  },

  fetchClusters: async () => {
    set({ isClustersLoading: true, error: null })

    try {
      const response = await advocateGrievanceApi.listClusters()
      set({ clusters: response, isClustersLoading: false })
    } catch (error) {
      set({
        isClustersLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load clusters.',
      })
      throw error
    }
  },

  fetchClusterComplaints: async (clusterId, params = {}) => {
    set({ isClusterComplaintsLoading: true, error: null })

    try {
      const response = await advocateGrievanceApi.listClusterComplaints(clusterId, params)
      set({
        clusterComplaints: response.data,
        clusterComplaintsPagination: response.pagination,
        isClusterComplaintsLoading: false,
      })
    } catch (error) {
      set({
        isClusterComplaintsLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load cluster complaints.',
      })
      throw error
    }
  },

  suggestClusters: async (complaintIds) => {
    set({ isMutating: true, error: null, notice: null })

    try {
      const response = await advocateGrievanceApi.suggestClusters(complaintIds)
      set({
        suggestedClusters: response.suggested_clusters,
        isMutating: false,
      })

      return response.suggested_clusters
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : 'Unable to suggest clusters.',
      })
      throw error
    }
  },

  updateTags: async (complaintId, payload) => {
    set({ isMutating: true, error: null, notice: null })

    try {
      const response = await advocateGrievanceApi.updateTags(complaintId, payload)
      set((state) => ({
        complaints: upsertComplaint(state.complaints, response.data),
        clusterComplaints: upsertComplaint(state.clusterComplaints, response.data),
        isMutating: false,
        notice: 'Complaint tags updated successfully.',
      }))
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : 'Unable to update complaint tags.',
      })
      throw error
    }
  },

  updateStatus: async (complaintId, payload) => {
    set({ isMutating: true, error: null, notice: null })

    try {
      const response = await advocateGrievanceApi.updateStatus(complaintId, payload)
      set((state) => ({
        complaints: upsertComplaint(state.complaints, response.data),
        clusterComplaints: upsertComplaint(state.clusterComplaints, response.data),
        isMutating: false,
        notice: 'Complaint status updated successfully.',
      }))
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : 'Unable to update complaint status.',
      })
      throw error
    }
  },

  updateCluster: async (complaintId, payload) => {
    set({ isMutating: true, error: null, notice: null })

    try {
      const response = await advocateGrievanceApi.updateCluster(complaintId, payload)
      set((state) => ({
        complaints: upsertComplaint(state.complaints, response.data),
        clusterComplaints: upsertComplaint(state.clusterComplaints, response.data),
        isMutating: false,
        notice: 'Complaint cluster updated successfully.',
      }))
    } catch (error) {
      set({
        isMutating: false,
        error: error instanceof Error ? error.message : 'Unable to update complaint cluster.',
      })
      throw error
    }
  },

  fetchTopCategories: async () => {
    set({ isAnalyticsLoading: true, error: null })

    try {
      const response = await advocateGrievanceApi.getTopCategories()
      set({ topCategories: response, isAnalyticsLoading: false })
    } catch (error) {
      set({
        isAnalyticsLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load top categories.',
      })
      throw error
    }
  },

  fetchComplaintsByPlatform: async (params = {}) => {
    set({ isAnalyticsLoading: true, error: null })

    try {
      const response = await advocateGrievanceApi.getComplaintsByPlatform(params)
      set({ complaintsByPlatform: response, isAnalyticsLoading: false })
    } catch (error) {
      set({
        isAnalyticsLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load platform complaint trends.',
      })
      throw error
    }
  },

  fetchEscalationRatio: async () => {
    set({ isAnalyticsLoading: true, error: null })

    try {
      const response = await advocateGrievanceApi.getEscalationRatio()
      set({ escalationRatio: response, isAnalyticsLoading: false })
    } catch (error) {
      set({
        isAnalyticsLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load escalation ratio.',
      })
      throw error
    }
  },

  fetchComplaintAnalytics: async (params = {}) => {
    set({ isAnalyticsLoading: true, error: null })

    try {
      const [topCategories, complaintsByPlatform, escalationRatio] = await Promise.all([
        advocateGrievanceApi.getTopCategories(),
        advocateGrievanceApi.getComplaintsByPlatform(params),
        advocateGrievanceApi.getEscalationRatio(),
      ])

      set({
        topCategories,
        complaintsByPlatform,
        escalationRatio,
        isAnalyticsLoading: false,
      })
    } catch (error) {
      set({
        isAnalyticsLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load complaint analytics.',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  clearNotice: () => set({ notice: null }),
}))
