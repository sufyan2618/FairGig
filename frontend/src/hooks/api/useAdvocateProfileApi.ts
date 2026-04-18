import { useShallow } from 'zustand/react/shallow'
import { useAdvocateProfileStore } from '../../store/advocateProfileStore'

export const useAdvocateProfileApi = () =>
  useAdvocateProfileStore(
    useShallow((state) => ({
      profile: state.profile,
      passwordPayload: state.passwordPayload,
      isLoading: state.isLoading,
      isSaving: state.isSaving,
      error: state.error,
      notice: state.notice,
      fetchProfile: state.fetchProfile,
      updateProfileField: state.updateProfileField,
      saveProfile: state.saveProfile,
      updatePasswordField: state.updatePasswordField,
      resetPasswordPayload: state.resetPasswordPayload,
      changePassword: state.changePassword,
      clearError: state.clearError,
      clearNotice: state.clearNotice,
    })),
  )
