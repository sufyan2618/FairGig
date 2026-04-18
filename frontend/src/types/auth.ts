export type UserRole = 'worker' | 'verifier' | 'advocate'

export interface AuthUser {
	id: string
	email: string
	full_name: string
	role: UserRole
	is_email_verified: boolean
	is_active: boolean
	created_at: string
	last_login_at: string | null
}

export interface AuthTokens {
	access_token: string
	refresh_token: string
	token_type: string
	expires_in: number
}

export interface AuthSession {
	accessToken: string
	refreshToken: string
	tokenType: string
	expiresIn: number
	accessTokenExpiresAt: number
}

export interface RegisterRequest {
	full_name: string
	email: string
	password: string
	role: UserRole
}

export interface RegisterResponse {
	message: string
	user: AuthUser
}

export interface VerifyEmailOtpRequest {
	email: string
	otp_code: string
}

export interface ResendEmailOtpRequest {
	email: string
}

export interface LoginRequest {
	email: string
	password: string
}

export interface LoginResponse {
	tokens: AuthTokens
	user: AuthUser
}

export interface RefreshRequest {
	refresh_token: string
}

export interface RefreshResponse {
	tokens: AuthTokens
	user: AuthUser
}

export interface LogoutRequest {
	refresh_token: string
}

export interface ForgotPasswordRequest {
	email: string
}

export interface ResetPasswordRequest {
	email: string
	otp_code: string
	new_password: string
}

export interface IntrospectResponse {
	user_id: string
	full_name: string
	email: string
	role: UserRole
}

export interface BasicMessageResponse {
	message: string
}