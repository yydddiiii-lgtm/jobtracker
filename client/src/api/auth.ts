import apiClient from './client'
import type { ApiResponse, User } from '../types'

export const authApi = {
  register: (data: { email: string; password: string; name: string }) =>
    apiClient.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/register', data),

  login: (data: { email: string; password: string; rememberMe: boolean }) =>
    apiClient.post<ApiResponse<{ user: User; accessToken: string }>>('/auth/login', data),

  refresh: () =>
    apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh'),

  me: () =>
    apiClient.get<ApiResponse<{ user: User }>>('/auth/me'),

  logout: () =>
    apiClient.post('/auth/logout'),
}
