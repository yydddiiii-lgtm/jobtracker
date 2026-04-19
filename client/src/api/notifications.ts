import apiClient from './client'
import type { ApiResponse, Notification } from '../types'

export const notificationsApi = {
  list: (params?: { is_read?: boolean; page?: number; limit?: number }) =>
    apiClient.get<ApiResponse<{ notifications: Notification[] }>>('/notifications', { params }),

  markRead: (id: string) =>
    apiClient.patch<ApiResponse<Notification>>(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch<ApiResponse<{ updated: number }>>('/notifications/read-all'),
}
