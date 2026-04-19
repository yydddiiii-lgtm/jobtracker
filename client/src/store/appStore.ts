import { create } from 'zustand'
import type { Application } from '../types'
import { applicationsApi } from '../api/applications'
import { handleApiError } from '../utils/apiError'

interface AppState {
  applications: Application[]
  isLoading: boolean
  fetchApplications: () => Promise<void>
  addApplication: (app: Application) => void
  updateApplication: (id: string, data: Partial<Application>) => void
  removeApplication: (id: string) => void
}

export const useAppStore = create<AppState>((set) => ({
  applications: [],
  isLoading: false,

  fetchApplications: async () => {
    set({ isLoading: true })
    try {
      const res = await applicationsApi.list({ no_pagination: 'true' })
      set({ applications: res.data.data.rows })
    } catch (err) {
      handleApiError(err, '加载申请列表失败')
    } finally {
      set({ isLoading: false })
    }
  },

  addApplication: (app) =>
    set((state) => ({ applications: [app, ...state.applications] })),

  updateApplication: (id, data) =>
    set((state) => ({
      applications: state.applications.map((a) =>
        a.id === id ? { ...a, ...data } : a
      ),
    })),

  removeApplication: (id) =>
    set((state) => ({
      applications: state.applications.filter((a) => a.id !== id),
    })),
}))
