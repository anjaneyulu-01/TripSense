import { api } from '@/api/client'
import type { AuthResponse, User } from '@/types'

export interface RegisterPayload {
  email: string
  full_name: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export const authApi = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/register', payload)
    return data
  },
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const { data } = await api.post<AuthResponse>('/auth/login', payload)
    return data
  },
  me: async (): Promise<User> => {
    const { data } = await api.get<User>('/auth/me')
    return data
  },
}
