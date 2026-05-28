import axios from 'axios'

interface FastApiValidationErrorItem {
	loc?: unknown[]
	msg?: string
}

interface ApiErrorBody {
	detail?: string | FastApiValidationErrorItem[]
	message?: string
	error?: string
}

const formatFastApiValidationErrors = (errors: FastApiValidationErrorItem[]): string | null => {
	const formatted = errors
		.map((item) => {
			const message = typeof item.msg === 'string' ? item.msg.trim() : ''

			if (!message) {
				return ''
			}

			const location = Array.isArray(item.loc) ? item.loc.filter((segment) => typeof segment === 'string') : []
			const field = location[location.length - 1]

			return field ? `${field}: ${message}` : message
		})
		.filter(Boolean)

	if (!formatted.length) {
		return null
	}

	return formatted.join(', ')
}

// Paths in *Api.ts already start with /api/... — do not set base URL to /api (causes /api/api/...).
const FALLBACK_API_BASE_URL = ''

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() ?? FALLBACK_API_BASE_URL

export const apiHttp = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		'Content-Type': 'application/json',
	},
	timeout: 15000,
})

export const getHttpStatus = (error: unknown): number | null => {
	if (!axios.isAxiosError(error)) {
		return null
	}

	return error.response?.status ?? null
}

export const extractApiErrorMessage = (error: unknown, fallbackMessage = 'Something went wrong. Please try again.'): string => {
	if (!axios.isAxiosError<ApiErrorBody | string>(error)) {
		return fallbackMessage
	}

	const errorData = error.response?.data

	if (typeof errorData === 'string' && errorData.trim()) {
		const text = errorData.trim()

		try {
			const parsed = JSON.parse(text) as ApiErrorBody

			if (typeof parsed?.detail === 'string' && parsed.detail.trim()) {
				return parsed.detail
			}

			if (Array.isArray(parsed?.detail)) {
				const validationErrorMessage = formatFastApiValidationErrors(parsed.detail)

				if (validationErrorMessage) {
					return validationErrorMessage
				}
			}

			if (typeof parsed?.message === 'string' && parsed.message.trim()) {
				return parsed.message
			}

			if (typeof parsed?.error === 'string' && parsed.error.trim()) {
				return parsed.error
			}
		} catch {
			// Non-JSON text response; return raw message.
		}

		return text
	}

	if (errorData && typeof errorData === 'object') {
		const body = errorData as ApiErrorBody

		if (typeof body.detail === 'string' && body.detail.trim()) {
			return body.detail
		}

		if (Array.isArray(body.detail)) {
			const validationErrorMessage = formatFastApiValidationErrors(body.detail)

			if (validationErrorMessage) {
				return validationErrorMessage
			}
		}

		if (typeof body.message === 'string' && body.message.trim()) {
			return body.message
		}

		if (typeof body.error === 'string' && body.error.trim()) {
			return body.error
		}
	}

	if (typeof error.message === 'string' && error.message.trim()) {
		return error.message
	}

	return fallbackMessage
}