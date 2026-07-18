/** Shared API types — mirror the backend DTOs in `backend/app/schemas`. */

export type Language = 'en' | 'hi' | 'te'
export type Theme = 'light' | 'dark' | 'system'

export interface UserPreferences {
  language: Language
  theme: Theme
  voice_enabled: boolean
  notifications_enabled: boolean
}

export interface User {
  id: string
  email: string
  full_name: string
  is_active: boolean
  preferences: UserPreferences
}

export interface TokenPair {
  access_token: string
  refresh_token: string
  token_type: string
}

export interface AuthResponse {
  user: User
  tokens: TokenPair
}

export interface CollectedInfo {
  budget: number | null
  currency: string | null
  duration_days: number | null
  starting_city: string | null
  destination: string | null
  travel_type: string | null
  group_size: number | null
  interests: string[]
  food_preferences: string | null
  transport_preferences: string | null
  luxury_level: string | null
  has_children: boolean | null
  has_seniors: boolean | null
  medical_needs: string | null
  adventure_level: string | null
  accessibility_requirements: string | null
}

export interface ConsultResponse {
  conversation_id: string
  reply: string
  provider: string
  language: Language
  collected_info: CollectedInfo
  missing_fields: string[]
  ready_to_plan: boolean
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

/** A message rendered in the consultant conversation UI. */
export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  provider?: string
  pending?: boolean
}
