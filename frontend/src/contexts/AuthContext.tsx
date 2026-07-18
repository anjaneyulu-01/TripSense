import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { authApi, type LoginPayload, type RegisterPayload } from '@/api/auth'
import { setAuthFailureHandler } from '@/api/client'
import { tokenStore } from '@/lib/tokenStore'
import type { User } from '@/types'

interface AuthContextValue {
  user: User | null
  isAuthenticated: boolean
  isGuest: boolean
  isLoading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  continueAsGuest: () => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const GUEST_KEY = 'tripsense.guest'

function randomGuest(): RegisterPayload {
  const id = crypto.randomUUID().slice(0, 12)
  return {
    email: `guest_${id}@guest.tripsense.app`,
    full_name: 'Guest Explorer',
    password: `Gp!${crypto.randomUUID().replace(/-/g, '')}`,
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isGuest, setIsGuest] = useState<boolean>(
    () => localStorage.getItem(GUEST_KEY) === '1',
  )
  // Start "loading" only if we have a token to validate on boot.
  const [isLoading, setIsLoading] = useState<boolean>(tokenStore.has())

  const logout = useCallback(() => {
    tokenStore.clear()
    localStorage.removeItem(GUEST_KEY)
    setIsGuest(false)
    setUser(null)
  }, [])

  // If a refresh ultimately fails, the axios layer calls this -> hard logout.
  useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null)
    })
  }, [])

  // On mount, if a token exists, hydrate the current user.
  useEffect(() => {
    let active = true
    if (!tokenStore.has()) {
      setIsLoading(false)
      return
    }
    authApi
      .me()
      .then((u) => active && setUser(u))
      .catch(() => active && tokenStore.clear())
      .finally(() => active && setIsLoading(false))
    return () => {
      active = false
    }
  }, [])

  const login = useCallback(async (payload: LoginPayload) => {
    const res = await authApi.login(payload)
    tokenStore.set(res.tokens)
    localStorage.removeItem(GUEST_KEY)
    setIsGuest(false)
    setUser(res.user)
  }, [])

  const register = useCallback(async (payload: RegisterPayload) => {
    const res = await authApi.register(payload)
    tokenStore.set(res.tokens)
    localStorage.removeItem(GUEST_KEY)
    setIsGuest(false)
    setUser(res.user)
  }, [])

  // Explore with a throwaway account: everything (AI, persistence) works, but
  // we flag it as guest so the UI can nudge them to create a real account.
  const continueAsGuest = useCallback(async () => {
    const res = await authApi.register(randomGuest())
    tokenStore.set(res.tokens)
    localStorage.setItem(GUEST_KEY, '1')
    setIsGuest(true)
    setUser(res.user)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isGuest,
      isLoading,
      login,
      register,
      continueAsGuest,
      logout,
    }),
    [user, isGuest, isLoading, login, register, continueAsGuest, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
