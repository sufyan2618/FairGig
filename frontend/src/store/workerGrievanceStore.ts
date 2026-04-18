import { create } from 'zustand'
import { workerGrievanceApi, type ListGrievancesParams } from '../api/workerGrievanceApi'
import type { CreateGrievancePayload, GrievanceComplaint, PaginationMeta } from '../types/worker'

interface WorkerGrievanceState {
  complaints: GrievanceComplaint[]
  pagination: PaginationMeta
  isLoading: boolean
  isSubmitting: boolean
  error: string | null
  notice: string | null
  fetchComplaints: (params?: ListGrievancesParams) => Promise<void>
  createComplaint: (payload: CreateGrievancePayload) => Promise<GrievanceComplaint>
  deleteComplaint: (complaintId: string) => Promise<void>
  clearError: () => void
  clearNotice: () => void
}

const defaultPagination: PaginationMeta = {
  page: 1,
  limit: 20,
  total: 0,
  total_pages: 0,
}

export const useWorkerGrievanceStore = create<WorkerGrievanceState>((set, get) => ({
  complaints: [],
  pagination: defaultPagination,
  isLoading: false,
  isSubmitting: false,
  error: null,
  notice: null,

  fetchComplaints: async (params = {}) => {
    set({ isLoading: true, error: null })
    try {
      const response = await workerGrievanceApi.listComplaints(params)
      set({
        complaints: response.data,
        pagination: response.pagination,
        isLoading: false,
      })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load grievances.',
      })
      throw error
    }
  },

  createComplaint: async (payload) => {
    set({ isSubmitting: true, error: null, notice: null })
    try {
      const response = await workerGrievanceApi.createComplaint(payload)
      set((state) => ({
        complaints: [response.data, ...state.complaints],
        isSubmitting: false,
        notice: 'Complaint posted successfully.',
      }))

      return response.data
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Unable to post grievance.',
      })
      throw error
    }
  },

  deleteComplaint: async (complaintId) => {
    set({ isSubmitting: true, error: null, notice: null })
    try {
      await workerGrievanceApi.deleteComplaint(complaintId)
      set((state) => ({
        complaints: state.complaints.filter((item) => item.id !== complaintId),
        isSubmitting: false,
        notice: 'Complaint deleted successfully.',
      }))

      if (get().complaints.length === 0 && get().pagination.page > 1) {
        await get().fetchComplaints({ page: get().pagination.page - 1, limit: get().pagination.limit })
      }
    } catch (error) {
      set({
        isSubmitting: false,
        error: error instanceof Error ? error.message : 'Unable to delete grievance.',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  clearNotice: () => set({ notice: null }),
}))
