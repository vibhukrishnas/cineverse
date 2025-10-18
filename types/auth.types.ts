import { User } from './database.types'

export interface AuthUser extends User {
  email: string
}

export interface SignUpFormData {
  email: string
  password: string
  confirmPassword: string
}

export interface LoginFormData {
  email: string
  password: string
  rememberMe?: boolean
}

export interface ResetPasswordFormData {
  email: string
}

export interface AuthError {
  message: string
  status?: number
}

export interface AuthResponse {
  user: AuthUser | null
  error: AuthError | null
}
