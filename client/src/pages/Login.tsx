import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { authApi } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import { handleApiError } from '../utils/apiError'

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少 8 位'),
  rememberMe: z.boolean().optional(),
})

const registerSchema = z.object({
  name: z.string().min(1, '请输入姓名').max(50, '姓名最长 50 字'),
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(8, '密码至少 8 位'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: '两次密码不一致',
  path: ['confirmPassword'],
})

type LoginForm = z.infer<typeof loginSchema>
type RegisterForm = z.infer<typeof registerSchema>

export default function Login() {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { setAccessToken, setUser } = useAuthStore()

  // 登录表单
  const loginForm = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  })

  // 注册表单
  const registerForm = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  const handleLogin = async (data: LoginForm) => {
    setLoading(true)
    try {
      const res = await authApi.login({
        email: data.email,
        password: data.password,
        rememberMe: data.rememberMe ?? false,
      })
      setAccessToken(res.data.data.accessToken)
      setUser(res.data.data.user)
      navigate('/board')
    } catch (err) {
      handleApiError(err, '邮箱或密码不正确')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (data: RegisterForm) => {
    setLoading(true)
    try {
      const res = await authApi.register({
        email: data.email,
        password: data.password,
        name: data.name,
      })
      setAccessToken(res.data.data.accessToken)
      setUser(res.data.data.user)
      navigate('/board')
    } catch (err) {
      handleApiError(err, '注册失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">JobTracker</h1>
          <p className="text-sm text-gray-500 mt-1">求职申请管理看板</p>
        </div>

        {/* 卡片 */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          {/* 模式切换 */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-6">
            <button
              onClick={() => setMode('login')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'login'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              登录
            </button>
            <button
              onClick={() => setMode('register')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                mode === 'register'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              注册
            </button>
          </div>

          {mode === 'login' ? (
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <Field label="邮箱" error={loginForm.formState.errors.email?.message}>
                <input
                  {...loginForm.register('email')}
                  type="email"
                  placeholder="your@email.com"
                  className={inputClass(!!loginForm.formState.errors.email)}
                  autoComplete="email"
                />
              </Field>

              <Field label="密码" error={loginForm.formState.errors.password?.message}>
                <input
                  {...loginForm.register('password')}
                  type="password"
                  placeholder="至少 8 位"
                  className={inputClass(!!loginForm.formState.errors.password)}
                  autoComplete="current-password"
                />
              </Field>

              <div className="flex items-center gap-2">
                <input
                  {...loginForm.register('rememberMe')}
                  type="checkbox"
                  id="rememberMe"
                  className="w-4 h-4 rounded border-gray-300 text-blue-600"
                />
                <label htmlFor="rememberMe" className="text-sm text-gray-600">记住我（7天）</label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '登录中...' : '登录'}
              </button>
            </form>
          ) : (
            <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
              <Field label="姓名" error={registerForm.formState.errors.name?.message}>
                <input
                  {...registerForm.register('name')}
                  type="text"
                  placeholder="你的名字"
                  className={inputClass(!!registerForm.formState.errors.name)}
                  autoComplete="name"
                />
              </Field>

              <Field label="邮箱" error={registerForm.formState.errors.email?.message}>
                <input
                  {...registerForm.register('email')}
                  type="email"
                  placeholder="your@email.com"
                  className={inputClass(!!registerForm.formState.errors.email)}
                  autoComplete="email"
                />
              </Field>

              <Field label="密码" error={registerForm.formState.errors.password?.message}>
                <input
                  {...registerForm.register('password')}
                  type="password"
                  placeholder="至少 8 位"
                  className={inputClass(!!registerForm.formState.errors.password)}
                  autoComplete="new-password"
                />
              </Field>

              <Field label="确认密码" error={registerForm.formState.errors.confirmPassword?.message}>
                <input
                  {...registerForm.register('confirmPassword')}
                  type="password"
                  placeholder="再输一次"
                  className={inputClass(!!registerForm.formState.errors.confirmPassword)}
                  autoComplete="new-password"
                />
              </Field>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? '注册中...' : '创建账号'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  )
}

function inputClass(hasError: boolean) {
  return `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100'
  }`
}
