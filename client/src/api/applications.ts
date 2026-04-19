import apiClient from './client'
import type { ApiResponse, Application, StageLog } from '../types'

export const applicationsApi = {
  list: (params?: Record<string, string>) =>
    apiClient.get<ApiResponse<{ rows: Application[]; total: number }>>('/applications', { params }),

  getById: (id: string) =>
    apiClient.get<ApiResponse<{ application: Application }>>(`/applications/${id}`),

  create: (data: Partial<Application>) =>
    apiClient.post<ApiResponse<{ application: Application }>>('/applications', data),

  update: (id: string, data: Partial<Application>) =>
    apiClient.patch<ApiResponse<{ application: Application }>>(`/applications/${id}`, data),

  remove: (id: string) =>
    apiClient.delete<ApiResponse<null>>(`/applications/${id}`),

  getStageLogs: (id: string) =>
    apiClient.get<ApiResponse<{ stage_logs: StageLog[] }>>(`/applications/${id}/stage-logs`),
}
