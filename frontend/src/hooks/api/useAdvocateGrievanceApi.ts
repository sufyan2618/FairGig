import { useShallow } from 'zustand/react/shallow'
import { useAdvocateGrievanceStore } from '../../store/advocateGrievanceStore'

export const useAdvocateGrievanceApi = () =>
  useAdvocateGrievanceStore(
    useShallow((state) => ({
      complaints: state.complaints,
      pagination: state.pagination,
      clusters: state.clusters,
      clusterComplaints: state.clusterComplaints,
      clusterComplaintsPagination: state.clusterComplaintsPagination,
      suggestedClusters: state.suggestedClusters,
      topCategories: state.topCategories,
      complaintsByPlatform: state.complaintsByPlatform,
      escalationRatio: state.escalationRatio,
      isComplaintsLoading: state.isComplaintsLoading,
      isClustersLoading: state.isClustersLoading,
      isClusterComplaintsLoading: state.isClusterComplaintsLoading,
      isMutating: state.isMutating,
      isAnalyticsLoading: state.isAnalyticsLoading,
      error: state.error,
      notice: state.notice,
      fetchComplaints: state.fetchComplaints,
      fetchClusters: state.fetchClusters,
      fetchClusterComplaints: state.fetchClusterComplaints,
      suggestClusters: state.suggestClusters,
      updateTags: state.updateTags,
      updateStatus: state.updateStatus,
      updateCluster: state.updateCluster,
      fetchTopCategories: state.fetchTopCategories,
      fetchComplaintsByPlatform: state.fetchComplaintsByPlatform,
      fetchEscalationRatio: state.fetchEscalationRatio,
      fetchComplaintAnalytics: state.fetchComplaintAnalytics,
      clearError: state.clearError,
      clearNotice: state.clearNotice,
    })),
  )
