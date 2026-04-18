import type { AxiosRequestConfig, AxiosResponse } from 'axios'
import { useAuthStore } from '../store/authStore'
import { apiHttp, extractApiErrorMessage, getHttpStatus } from './http'

const ensureAccessToken = (): string => {
  const accessToken = useAuthStore.getState().session?.accessToken
  if (!accessToken) {
    throw new Error('Please sign in first.')
  }
  return accessToken
}

const withAuthorizationHeader = (config: AxiosRequestConfig, accessToken: string): AxiosRequestConfig => {
  const headers: Record<string, unknown> = {
    ...(config.headers as Record<string, unknown> | undefined),
    Authorization: `Bearer ${accessToken}`,
  }

  if (typeof FormData !== 'undefined' && config.data instanceof FormData) {
    headers['Content-Type'] = undefined
  }

  return {
    ...config,
    headers: headers as AxiosRequestConfig['headers'],
  }
}

export const authenticatedRequest = async <T>(
  config: AxiosRequestConfig,
  fallbackMessage = 'Unable to complete request right now.',
): Promise<AxiosResponse<T>> => {
  let accessToken = ensureAccessToken()

  try {
    return await apiHttp.request<T>(withAuthorizationHeader(config, accessToken))
  } catch (error) {
    if (getHttpStatus(error) === 401) {
      const refreshed = await useAuthStore.getState().refreshSession()
      if (refreshed) {
        accessToken = ensureAccessToken()
        try {
          return await apiHttp.request<T>(withAuthorizationHeader(config, accessToken))
        } catch (retryError) {
          throw new Error(extractApiErrorMessage(retryError, fallbackMessage))
        }
      }
    }

    throw new Error(extractApiErrorMessage(error, fallbackMessage))
  }
}
