import type { UserRole } from '../types/auth'

export const getHomeRouteForRole = (role: UserRole): string => {
	if (role === 'advocate') {
		return '/advocate/dashboard'
	}

	if (role === 'verifier') {
		return '/verifier/dashboard'
	}

	return '/dashboard'
}