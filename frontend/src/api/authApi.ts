import { apiHttp } from './http'
import type {
	BasicMessageResponse,
	ForgotPasswordRequest,
	IntrospectResponse,
	LoginRequest,
	LoginResponse,
	LogoutRequest,
	RefreshRequest,
	RefreshResponse,
	RegisterRequest,
	RegisterResponse,
	ResendEmailOtpRequest,
	ResetPasswordRequest,
	VerifyEmailOtpRequest,
	AuthUser,
} from '../types/auth'

const AUTH_PREFIX = '/api/auth'

const withAccessToken = (accessToken: string) => ({
	headers: {
		Authorization: `Bearer ${accessToken}`,
	},
})

export const authApi = {
	register: async (payload: RegisterRequest): Promise<RegisterResponse> => {
		const response = await apiHttp.post<RegisterResponse>(`${AUTH_PREFIX}/register`, payload)
		return response.data
	},

	verifyEmailOtp: async (payload: VerifyEmailOtpRequest): Promise<BasicMessageResponse> => {
		const response = await apiHttp.post<BasicMessageResponse>(`${AUTH_PREFIX}/verify-email-otp`, payload)
		return response.data
	},

	resendEmailOtp: async (payload: ResendEmailOtpRequest): Promise<BasicMessageResponse> => {
		const response = await apiHttp.post<BasicMessageResponse>(`${AUTH_PREFIX}/resend-email-otp`, payload)
		return response.data
	},

	login: async (payload: LoginRequest): Promise<LoginResponse> => {
		const response = await apiHttp.post<LoginResponse>(`${AUTH_PREFIX}/login`, payload)
		return response.data
	},

	refresh: async (payload: RefreshRequest): Promise<RefreshResponse> => {
		const response = await apiHttp.post<RefreshResponse>(`${AUTH_PREFIX}/refresh`, payload)
		return response.data
	},

	logout: async (payload: LogoutRequest): Promise<BasicMessageResponse> => {
		const response = await apiHttp.post<BasicMessageResponse>(`${AUTH_PREFIX}/logout`, payload)
		return response.data
	},

	forgotPassword: async (payload: ForgotPasswordRequest): Promise<BasicMessageResponse> => {
		const response = await apiHttp.post<BasicMessageResponse>(`${AUTH_PREFIX}/forgot-password`, payload)
		return response.data
	},

	resetPassword: async (payload: ResetPasswordRequest): Promise<BasicMessageResponse> => {
		const response = await apiHttp.post<BasicMessageResponse>(`${AUTH_PREFIX}/reset-password`, payload)
		return response.data
	},

	me: async (accessToken: string): Promise<AuthUser> => {
		const response = await apiHttp.get<AuthUser>(`${AUTH_PREFIX}/me`, withAccessToken(accessToken))
		return response.data
	},

	introspect: async (accessToken: string): Promise<IntrospectResponse> => {
		const response = await apiHttp.get<IntrospectResponse>(`${AUTH_PREFIX}/introspect`, withAccessToken(accessToken))
		return response.data
	},
}