import apiClient from './client'
import type { ApiResponse, StatsOverview } from '../types'

export const statsApi = {
  overview: () =>
    apiClient.get<ApiResponse<StatsOverview>>('/stats/overview'),
}
