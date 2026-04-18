import { useShallow } from 'zustand/react/shallow'
import { useAuthStore } from '../../store/authStore'

export const useAuthApi = () =>
	useAuthStore(
		useShallow((state) => ({
			session: state.session,
			user: state.user,
			isAuthenticated: state.isAuthenticated,
			pendingVerificationEmail: state.pendingVerificationEmail,
			passwordResetEmail: state.passwordResetEmail,
			rememberMe: state.rememberMe,
			isLoading: state.isLoading,
			error: state.error,
			hasHydrated: state.hasHydrated,
			clearError: state.clearError,
			setRememberMe: state.setRememberMe,
			register: state.register,
			verifyEmailOtp: state.verifyEmailOtp,
			resendEmailOtp: state.resendEmailOtp,
			login: state.login,
			refreshSession: state.refreshSession,
			fetchCurrentUser: state.fetchCurrentUser,
			forgotPassword: state.forgotPassword,
			resetPassword: state.resetPassword,
			logout: state.logout,
			resetAuthState: state.resetAuthState,
			hasRoleAccess: state.hasRoleAccess,
		})),
	)