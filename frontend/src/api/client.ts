import axios, {
  AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from 'axios'
import { tokenStore } from '@/lib/tokenStore'
import type { ApiError, TokenPair } from '@/types'

const API_BASE = '/api/v1'

export const api: AxiosInstance = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
})

// --- Request: attach the access token ---------------------------------------
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = tokenStore.getAccess()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// --- Response: transparently refresh on 401 ---------------------------------
// A single in-flight refresh is shared by all queued requests so we never fire
// multiple /auth/refresh calls at once.
let refreshPromise: Promise<TokenPair> | null = null

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean }

// Called by AuthContext to react to a hard logout (refresh failed).
let onAuthFailure: (() => void) | null = null
export function setAuthFailureHandler(fn: () => void): void {
  onAuthFailure = fn
}

async function refreshTokens(): Promise<TokenPair> {
  const refresh_token = tokenStore.getRefresh()
  if (!refresh_token) throw new Error('No refresh token')
  const { data } = await axios.post<TokenPair>(`${API_BASE}/auth/refresh`, {
    refresh_token,
  })
  tokenStore.set(data)
  return data
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const original = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const isRefreshCall = original?.url?.includes('/auth/refresh')

    if (status === 401 && original && !original._retry && !isRefreshCall) {
      original._retry = true
      try {
        refreshPromise ??= refreshTokens()
        const tokens = await refreshPromise
        original.headers.Authorization = `Bearer ${tokens.access_token}`
        return api(original)
      } catch (refreshErr) {
        tokenStore.clear()
        onAuthFailure?.()
        return Promise.reject(refreshErr)
      } finally {
        refreshPromise = null
      }
    }
    return Promise.reject(error)
  },
)

/** Extract a human-friendly message from an axios error. */
export function getErrorMessage(err: unknown, fallback = 'Something went wrong.'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as ApiError | undefined
    return data?.error?.message ?? err.message ?? fallback
  }
  return fallback
}
