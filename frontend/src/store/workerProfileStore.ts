import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { workerProfileApi } from '../api/workerProfileApi'
import { useAuthStore } from './authStore'
import type { AuthUser } from '../types/auth'
import type {
  WorkerChangePasswordPayload,
  WorkerNotificationPrefs,
  WorkerProfilePrefs,
  WorkerProfileUpdatePayload,
} from '../types/worker'

const defaultNotificationPrefs: WorkerNotificationPrefs = {
  appNotifications: true,
  smsAlerts: false,
  payoutUpdates: true,
  grievanceUpdates: true,
}

const defaultPrefs: WorkerProfilePrefs = {
  city: '',
  primaryCategory: '',
  notifications: defaultNotificationPrefs,
}

interface WorkerProfileState {
  profile: AuthUser | null
  prefs: WorkerProfilePrefs
  isLoading: boolean
  isSaving: boolean
  error: string | null
  notice: string | null
  fetchProfile: () => Promise<AuthUser>
  saveAccountDetails: (payload: WorkerProfileUpdatePayload & { city: string; primaryCategory: string }) => Promise<AuthUser>
  changePassword: (payload: WorkerChangePasswordPayload) => Promise<void>
  saveNotificationPrefs: (prefs: WorkerNotificationPrefs) => void
  clearError: () => void
  clearNotice: () => void
}

export const useWorkerProfileStore = create<WorkerProfileState>()(
  persist(
    (set) => ({
      profile: null,
      prefs: defaultPrefs,
      isLoading: false,
      isSaving: false,
      error: null,
      notice: null,

      fetchProfile: async () => {
        set({ isLoading: true, error: null })
        try {
          const profile = await workerProfileApi.getProfile()
          set({ profile, isLoading: false })
          useAuthStore.setState({ user: profile, isAuthenticated: true })
          return profile
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unable to load profile.',
          })
          throw error
        }
      },

      saveAccountDetails: async (payload) => {
        set({ isSaving: true, error: null, notice: null })
        try {
          const profile = await workerProfileApi.updateProfile({ full_name: payload.full_name })
          set((state) => ({
            profile,
            prefs: {
              ...state.prefs,
              city: payload.city,
              primaryCategory: payload.primaryCategory,
            },
            isSaving: false,
            notice: 'Account details saved successfully.',
          }))

          useAuthStore.setState({ user: profile, isAuthenticated: true })
          return profile
        } catch (error) {
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : 'Unable to save account details.',
          })
          throw error
        }
      },

      changePassword: async (payload) => {
        set({ isSaving: true, error: null, notice: null })
        try {
          await workerProfileApi.changePassword(payload)
          set({
            isSaving: false,
            notice: 'Password updated successfully.',
          })
        } catch (error) {
          set({
            isSaving: false,
            error: error instanceof Error ? error.message : 'Unable to change password.',
          })
          throw error
        }
      },

      saveNotificationPrefs: (prefs) => {
        set((state) => ({
          prefs: {
            ...state.prefs,
            notifications: prefs,
          },
          notice: 'Notification preferences updated.',
        }))
      },

      clearError: () => set({ error: null }),
      clearNotice: () => set({ notice: null }),
    }),
    {
      name: 'fairgig-worker-profile-store',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        prefs: state.prefs,
      }),
    },
  ),
)
