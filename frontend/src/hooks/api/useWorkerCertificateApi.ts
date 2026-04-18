import { useShallow } from 'zustand/react/shallow'
import { useWorkerCertificateStore } from '../../store/workerCertificateStore'

export const useWorkerCertificateApi = () =>
  useWorkerCertificateStore(
    useShallow((state) => ({
      html: state.html,
      isLoading: state.isLoading,
      error: state.error,
      lastRange: state.lastRange,
      generateCertificate: state.generateCertificate,
      clearCertificate: state.clearCertificate,
      clearError: state.clearError,
    })),
  )
