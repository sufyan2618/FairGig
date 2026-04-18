import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { authApi } from '../api/authApi'
import { extractApiErrorMessage, getHttpStatus } from '../api/http'
import type {
	AuthSession,
	AuthTokens,
	AuthUser,
	BasicMessageResponse,
	LoginRequest,
	LoginResponse,
	RegisterRequest,
	RegisterResponse,
	ResetPasswordRequest,
	UserRole,
} from '../types/auth'

interface AuthStoreState {
	session: AuthSession | null
	user: AuthUser | null
	isAuthenticated: boolean
	pendingVerificationEmail: string | null
	passwordResetEmail: string | null
	rememberMe: boolean
	isLoading: boolean
	error: string | null
	hasHydrated: boolean
	clearError: () => void
	setRememberMe: (rememberMe: boolean) => void
	setHydrated: (hydrated: boolean) => void
	register: (payload: RegisterRequest) => Promise<RegisterResponse>
	verifyEmailOtp: (email: string, otpCode: string) => Promise<BasicMessageResponse>
	resendEmailOtp: (email: string) => Promise<BasicMessageResponse>
	login: (payload: LoginRequest) => Promise<LoginResponse>
	refreshSession: () => Promise<boolean>
	fetchCurrentUser: () => Promise<AuthUser | null>
	forgotPassword: (email: string) => Promise<BasicMessageResponse>
	resetPassword: (payload: ResetPasswordRequest) => Promise<BasicMessageResponse>
	logout: () => Promise<void>
	resetAuthState: () => void
	hasRoleAccess: (allowedRole: UserRole) => boolean
}

const AUTH_STORE_KEY = 'fairgig-auth-store'

const buildSession = (tokens: AuthTokens): AuthSession => ({
	accessToken: tokens.access_token,
	refreshToken: tokens.refresh_token,
	tokenType: tokens.token_type,
	expiresIn: tokens.expires_in,
	accessTokenExpiresAt: Date.now() + tokens.expires_in * 1000,
})

const getCleanAuthState = () => ({
	session: null,
	user: null,
	isAuthenticated: false,
	pendingVerificationEmail: null,
	passwordResetEmail: null,
})

const toError = (error: unknown, fallback: string): Error => {
	const message = extractApiErrorMessage(error, fallback)
	return new Error(message)
}

export const useAuthStore = create<AuthStoreState>()(
	persist(
		(set, get) => ({
			...getCleanAuthState(),
			rememberMe: true,
			isLoading: false,
			error: null,
			hasHydrated: false,

			clearError: () => set({ error: null }),

			setRememberMe: (rememberMe) => set({ rememberMe }),

			setHydrated: (hydrated) => set({ hasHydrated: hydrated }),

			register: async (payload) => {
				set({ isLoading: true, error: null })

				try {
					const response = await authApi.register(payload)
					set({ pendingVerificationEmail: payload.email, isLoading: false })
					return response
				} catch (error) {
					const normalizedError = toError(error, 'Unable to register account right now.')
					set({ error: normalizedError.message, isLoading: false })
					throw normalizedError
				}
			},

			verifyEmailOtp: async (email, otpCode) => {
				set({ isLoading: true, error: null })

				try {
					const response = await authApi.verifyEmailOtp({ email, otp_code: otpCode })
					set({ pendingVerificationEmail: null, isLoading: false })
					return response
				} catch (error) {
					const normalizedError = toError(error, 'Unable to verify OTP. Please try again.')
					set({ error: normalizedError.message, isLoading: false })
					throw normalizedError
				}
			},

			resendEmailOtp: async (email) => {
				set({ isLoading: true, error: null })

				try {
					const response = await authApi.resendEmailOtp({ email })
					set({ pendingVerificationEmail: email, isLoading: false })
					return response
				} catch (error) {
					const normalizedError = toError(error, 'Unable to resend OTP right now.')
					set({ error: normalizedError.message, isLoading: false })
					throw normalizedError
				}
			},

			login: async (payload) => {
				set({ isLoading: true, error: null })

				try {
					const response = await authApi.login(payload)

					set({
						session: buildSession(response.tokens),
						user: response.user,
						isAuthenticated: true,
						pendingVerificationEmail: null,
						isLoading: false,
					})

					return response
				} catch (error) {
					const normalizedError = toError(error, 'Unable to sign in. Please check your credentials.')
					set({ error: normalizedError.message, isLoading: false })
					throw normalizedError
				}
			},

			refreshSession: async () => {
				const refreshToken = get().session?.refreshToken

				if (!refreshToken) {
					return false
				}

				try {
					const response = await authApi.refresh({ refresh_token: refreshToken })
					set({
						session: buildSession(response.tokens),
						user: response.user,
						isAuthenticated: true,
						error: null,
					})
					return true
				} catch {
					set({
						...getCleanAuthState(),
						error: 'Session expired. Please sign in again.',
					})
					return false
				}
			},

			fetchCurrentUser: async () => {
				const accessToken = get().session?.accessToken

				if (!accessToken) {
					return null
				}

				set({ isLoading: true, error: null })

				try {
					const user = await authApi.me(accessToken)
					set({ user, isAuthenticated: true, isLoading: false })
					return user
				} catch (error) {
					const status = getHttpStatus(error)

					if (status === 401) {
						const refreshed = await get().refreshSession()

						if (refreshed) {
							const retriedToken = get().session?.accessToken

							if (retriedToken) {
								try {
									const user = await authApi.me(retriedToken)
									set({ user, isAuthenticated: true, isLoading: false })
									return user
								} catch (retryError) {
									const normalizedRetryError = toError(retryError, 'Unable to restore your session.')
									set({ error: normalizedRetryError.message, isLoading: false })
									throw normalizedRetryError
								}
							}
						}
					}

					const normalizedError = toError(error, 'Unable to load your profile right now.')
					set({ error: normalizedError.message, isLoading: false })
					throw normalizedError
				}
			},

			forgotPassword: async (email) => {
				set({ isLoading: true, error: null })

				try {
					const response = await authApi.forgotPassword({ email })
					set({ passwordResetEmail: email, isLoading: false })
					return response
				} catch (error) {
					const normalizedError = toError(error, 'Unable to send reset OTP right now.')
					set({ error: normalizedError.message, isLoading: false })
					throw normalizedError
				}
			},

			resetPassword: async (payload) => {
				set({ isLoading: true, error: null })

				try {
					const response = await authApi.resetPassword(payload)
					set({ passwordResetEmail: payload.email, isLoading: false })
					return response
				} catch (error) {
					const normalizedError = toError(error, 'Unable to reset password right now.')
					set({ error: normalizedError.message, isLoading: false })
					throw normalizedError
				}
			},

			logout: async () => {
				const accessToken = get().session?.accessToken
				const refreshToken = get().session?.refreshToken
				set({ isLoading: true, error: null })

				try {
					if (accessToken) {
						await authApi.logoutCurrent(accessToken)
					} else if (refreshToken) {
						await authApi.logout({ refresh_token: refreshToken })
					}
				} catch {
					// Clearing local session state is sufficient for client logout even if network revoke fails.
				} finally {
					set({
						...getCleanAuthState(),
						isLoading: false,
					})
				}
			},

			resetAuthState: () => {
				set({
					...getCleanAuthState(),
					error: null,
				})
			},

			hasRoleAccess: (allowedRole) => {
				const userRole = get().user?.role
				return Boolean(get().isAuthenticated && userRole && userRole === allowedRole)
			},
		}),
		{
			name: AUTH_STORE_KEY,
			storage: createJSONStorage(() => localStorage),
			partialize: (state) => ({
				session: state.session,
				user: state.user,
				isAuthenticated: state.isAuthenticated,
				pendingVerificationEmail: state.pendingVerificationEmail,
				passwordResetEmail: state.passwordResetEmail,
				rememberMe: state.rememberMe,
			}),
			onRehydrateStorage: () => (state) => {
				state?.setHydrated(true)
			},
		},
	),
)