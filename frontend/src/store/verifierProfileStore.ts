import { create } from 'zustand'
import { verifierProfileApi } from '../api/verifierProfileApi'
import { useAuthStore } from './authStore'
import type { VerifierPasswordPayload, VerifierProfile } from '../types/verifier'

interface VerifierProfileState {
  profile: VerifierProfile | null
  passwordPayload: VerifierPasswordPayload
  isLoading: boolean
  isSaving: boolean
  error: string | null
  notice: string | null
  fetchProfile: () => Promise<void>
  updateProfileField: (field: keyof VerifierProfile, value: string) => void
  saveProfile: () => Promise<void>
  updatePasswordField: (field: keyof VerifierPasswordPayload, value: string) => void
  resetPasswordPayload: () => void
  changePassword: () => Promise<void>
  clearError: () => void
  clearNotice: () => void
}

const initialPasswordPayload: VerifierPasswordPayload = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const toVerifierProfile = (payload: { full_name: string; email: string }): VerifierProfile => ({
  fullName: payload.full_name,
  email: payload.email,
})

export const useVerifierProfileStore = create<VerifierProfileState>((set, get) => ({
  profile: null,
  passwordPayload: initialPasswordPayload,
  isLoading: false,
  isSaving: false,
  error: null,
  notice: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null })

    try {
      const profile = await verifierProfileApi.getProfile()
      set({
        profile: toVerifierProfile(profile),
        isLoading: false,
      })

      useAuthStore.setState({ user: profile, isAuthenticated: true })
    } catch (error) {
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unable to load profile.',
      })
      throw error
    }
  },

  updateProfileField: (field, value) => {
    set((state) => ({
      profile: {
        fullName: state.profile?.fullName ?? '',
        email: state.profile?.email ?? '',
        [field]: value,
      },
    }))
  },

  saveProfile: async () => {
    const profile = get().profile
    if (!profile) {
      throw new Error('Profile is not loaded yet.')
    }

    set({ isSaving: true, error: null, notice: null })

    try {
      const updated = await verifierProfileApi.updateProfile({
        full_name: profile.fullName,
      })

      set({
        profile: toVerifierProfile(updated),
        isSaving: false,
        notice: 'Profile settings updated successfully.',
      })

      useAuthStore.setState({ user: updated, isAuthenticated: true })
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Unable to update profile.',
      })
      throw error
    }
  },

  updatePasswordField: (field, value) => {
    set((state) => ({
      passwordPayload: {
        ...state.passwordPayload,
        [field]: value,
      },
    }))
  },

  resetPasswordPayload: () => {
    set({ passwordPayload: initialPasswordPayload })
  },

  changePassword: async () => {
    const { passwordPayload } = get()

    set({ isSaving: true, error: null, notice: null })

    try {
      await verifierProfileApi.changePassword({
        current_password: passwordPayload.currentPassword,
        new_password: passwordPayload.newPassword,
      })

      set({
        isSaving: false,
        passwordPayload: initialPasswordPayload,
        notice: 'Password changed successfully.',
      })
    } catch (error) {
      set({
        isSaving: false,
        error: error instanceof Error ? error.message : 'Unable to change password.',
      })
      throw error
    }
  },

  clearError: () => set({ error: null }),
  clearNotice: () => set({ notice: null }),
}))
