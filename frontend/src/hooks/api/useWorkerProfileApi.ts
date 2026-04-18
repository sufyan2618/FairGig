import { useShallow } from 'zustand/react/shallow'
import { useWorkerProfileStore } from '../../store/workerProfileStore'

export const useWorkerProfileApi = () =>
  useWorkerProfileStore(
    useShallow((state) => ({
      profile: state.profile,
      prefs: state.prefs,
      isLoading: state.isLoading,
      isSaving: state.isSaving,
      error: state.error,
      notice: state.notice,
      fetchProfile: state.fetchProfile,
      saveAccountDetails: state.saveAccountDetails,
      changePassword: state.changePassword,
      saveNotificationPrefs: state.saveNotificationPrefs,
      clearError: state.clearError,
      clearNotice: state.clearNotice,
    })),
  )
