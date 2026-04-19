import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useAuthStore } from './store/authStore'
import { authApi } from './api/auth'
import Layout from './components/Layout'
import ToastContainer from './components/Toast'
import Spinner from './components/Spinner'
import Login from './pages/Login'
import Board from './pages/Board'
import ApplicationDetail from './pages/ApplicationDetail'
import Calendar from './pages/Calendar'
import Offers from './pages/Offers'
import Stats from './pages/Stats'
import NotFound from './pages/NotFound'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { accessToken, isInitialized } = useAuthStore()

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  return accessToken ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  const { setAccessToken, setUser, setInitialized } = useAuthStore()

  useEffect(() => {
    const init = async () => {
      try {
        const refreshRes = await authApi.refresh()
        const token = refreshRes.data.data.accessToken
        setAccessToken(token)
        const meRes = await authApi.me()
        setUser(meRes.data.data.user)
      } catch {
        // Refresh 失败：未登录，正常
      } finally {
        setInitialized()
      }
    }
    init()
  }, [])

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/board" replace />} />
          <Route path="/board" element={<Board />} />
          <Route path="/applications/:id" element={<ApplicationDetail />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/offers" element={<Offers />} />
          <Route path="/stats" element={<Stats />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
      <ToastContainer />
    </BrowserRouter>
  )
}
