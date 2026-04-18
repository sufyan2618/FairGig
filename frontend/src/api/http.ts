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
	if (!axios.isAxiosError<ApiErrorBody>(error)) {
		return fallbackMessage
	}

	const errorData = error.response?.data

	if (typeof errorData?.detail === 'string' && errorData.detail.trim()) {
		return errorData.detail
	}

	if (typeof errorData?.message === 'string' && errorData.message.trim()) {
		return errorData.message
	}

	if (typeof errorData?.error === 'string' && errorData.error.trim()) {
		return errorData.error
	}

	if (typeof error.message === 'string' && error.message.trim()) {
		return error.message
	}

	return fallbackMessage
}