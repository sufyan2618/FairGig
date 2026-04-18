import { create } from 'zustand'
import { advocateProfileApi } from '../api/advocateProfileApi'
import { useAuthStore } from './authStore'
import type { AdvocatePasswordPayload, AdvocateProfile } from '../types/advocate'

interface AdvocateProfileState {
  profile: AdvocateProfile | null
  passwordPayload: AdvocatePasswordPayload
  isLoading: boolean
  isSaving: boolean
  error: string | null
  notice: string | null
  fetchProfile: () => Promise<void>
  updateProfileField: (field: keyof AdvocateProfile, value: string) => void
  saveProfile: () => Promise<void>
  updatePasswordField: (field: keyof AdvocatePasswordPayload, value: string) => void
  resetPasswordPayload: () => void
  changePassword: () => Promise<void>
  clearError: () => void
  clearNotice: () => void
}

const initialPasswordPayload: AdvocatePasswordPayload = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
}

const toAdvocateProfile = (payload: { full_name: string; email: string }): AdvocateProfile => ({
  fullName: payload.full_name,
  email: payload.email,
})

export const useAdvocateProfileStore = create<AdvocateProfileState>((set, get) => ({
  profile: null,
  passwordPayload: initialPasswordPayload,
  isLoading: false,
  isSaving: false,
  error: null,
  notice: null,

  fetchProfile: async () => {
    set({ isLoading: true, error: null })

    try {
      const profile = await advocateProfileApi.getProfile()
      set({
        profile: toAdvocateProfile(profile),
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
      const updated = await advocateProfileApi.updateProfile({
        full_name: profile.fullName,
      })

      set({
        profile: toAdvocateProfile(updated),
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
      await advocateProfileApi.changePassword({
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
