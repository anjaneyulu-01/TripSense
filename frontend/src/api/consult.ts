import { api } from '@/api/client'
import type { ConsultResponse, Language } from '@/types'

export interface ConsultPayload {
  message: string
  conversation_id?: string | null
  language?: Language
}

export const consultApi = {
  send: async (payload: ConsultPayload): Promise<ConsultResponse> => {
    const { data } = await api.post<ConsultResponse>('/consult', payload)
    return data
  },
}

export interface HealthStatus {
  status: string
  env: string
  database_connected: boolean
  ai_providers: string[]
  primary_provider: string | null
}

export const systemApi = {
  health: async (): Promise<HealthStatus> => {
    const { data } = await api.get<HealthStatus>('/health')
    return data
  },
}
