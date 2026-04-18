import axios from 'axios'

interface ApiErrorBody {
	detail?: string
	message?: string
	error?: string
}

const FALLBACK_API_BASE_URL = 'http://localhost:8080'

export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || FALLBACK_API_BASE_URL

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