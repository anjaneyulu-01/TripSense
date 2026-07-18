import type { TokenPair } from '@/types'

/**
 * Token persistence. localStorage keeps the user signed in across reloads.
 * A single source of truth so the axios interceptor and AuthContext agree.
 */
const ACCESS_KEY = 'tripsense.access'
const REFRESH_KEY = 'tripsense.refresh'

export const tokenStore = {
  getAccess: (): string | null => localStorage.getItem(ACCESS_KEY),
  getRefresh: (): string | null => localStorage.getItem(REFRESH_KEY),
  set: (tokens: TokenPair): void => {
    localStorage.setItem(ACCESS_KEY, tokens.access_token)
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token)
  },
  clear: (): void => {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
  },
  has: (): boolean => Boolean(localStorage.getItem(ACCESS_KEY)),
}
