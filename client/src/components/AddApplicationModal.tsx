import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useState } from 'react'
import { applicationsApi } from '../api/applications'
import { useAppStore } from '../store/appStore'
import { toast } from '../store/toastStore'
import { handleApiError } from '../utils/apiError'
import type { Stage, JobType, Priority } from '../types'

const schema = z.object({
  company_name: z.string().min(1, '公司名不能为空').max(100, '最长 100 字'),
  position: z.string().min(1, '岗位名不能为空').max(100, '最长 100 字'),
  job_type: z.enum(['daily_internship', 'summer_internship', 'winter_internship', 'fulltime', 'campus', 'internship'] as const),
  stage: z.string().optional(),
  city: z.string().max(50).optional(),
  deadline: z.string().optional(),
  salary_min: z.string().optional(),
  salary_max: z.string().optional(),
  priority: z.enum(['1', '2', '3'] as const),
  notes: z.string().optional(),
  job_url: z.string().url('请输入有效的 URL').optional().or(z.literal('')),
  referral_code: z.string().max(50).optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  onClose: () => void
  defaultStage?: Stage
}

export default function AddApplicationModal({ onClose, defaultStage = 'pending' }: Props) {
  const [loading, setLoading] = useState(false)
  const addApplication = useAppStore((s) => s.addApplication)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      job_type: 'daily_internship',
      priority: '2',
      stage: defaultStage,
    },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const payload = {
        company_name: data.company_name,
        position: data.position,
        job_type: data.job_type as JobType,
        stage: (data.stage || defaultStage) as Stage,
        priority: data.priority as Priority,
        city: data.city || null,
        deadline: data.deadline || null,
        salary_min: data.salary_min ? parseInt(data.salary_min) : null,
        salary_max: data.salary_max ? parseInt(data.salary_max) : null,
        notes: data.notes || null,
        job_url: data.job_url || null,
        referral_code: data.referral_code || null,
      }
      const res = await applicationsApi.create(payload)
      addApplication(res.data.data.application)
      toast.success('申请已添加')
      onClose()
    } catch (err) {
      handleApiError(err, '创建申请失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <h2 className="font-semibold text-gray-900">新建申请</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-4 space-y-4">
          {/* 公司名 + 岗位 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="公司名 *" error={errors.company_name?.message}>
              <input {...register('company_name')} placeholder="美团" className={ic(!!errors.company_name)} />
            </Field>
            <Field label="岗位 *" error={errors.position?.message}>
              <input {...register('position')} placeholder="AI产品经理" className={ic(!!errors.position)} />
            </Field>
          </div>

          {/* 类型 + 阶段 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="类型 *" error={errors.job_type?.message}>
              <select {...register('job_type')} className={ic(false)}>
                <option value="daily_internship">日常实习</option>
                <option value="summer_internship">暑期实习</option>
                <option value="winter_internship">寒假实习</option>
                <option value="fulltime">正式岗位</option>
              </select>
            </Field>
            <Field label="初始阶段">
              <select {...register('stage')} className={ic(false)}>
                <option value="pending">待投递</option>
                <option value="applied">已投递</option>
                <option value="written_test">笔试</option>
                <option value="interview_1">一面</option>
              </select>
            </Field>
          </div>

          {/* 城市 + 截止日期 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="城市">
              <input {...register('city')} placeholder="北京" className={ic(false)} />
            </Field>
            <Field label="截止日期">
              <input {...register('deadline')} type="date" className={ic(false)} />
            </Field>
          </div>

          {/* 薪资范围 */}
          <div className="grid grid-cols-2 gap-3">
            <Field label="薪资下限（元/月）">
              <input {...register('salary_min')} type="number" placeholder="15000" className={ic(false)} />
            </Field>
            <Field label="薪资上限（元/月）">
              <input {...register('salary_max')} type="number" placeholder="20000" className={ic(false)} />
            </Field>
          </div>

          {/* 内推码 */}
          <Field label="内推码（选填）">
            <input
              {...register('referral_code')}
              placeholder="如有内推码请填写"
              className={ic(false)}
            />
          </Field>

          {/* 优先级 */}
          <Field label="优先级" error={errors.priority?.message}>
            <div className="flex gap-2">
              {(['1', '2', '3'] as const).map((p) => {
                const labels = { '1': '低', '2': '中', '3': '高' }
                const colors = {
                  '1': 'border-gray-200 text-gray-500 peer-checked:bg-gray-100 peer-checked:border-gray-400',
                  '2': 'border-yellow-200 text-yellow-600 peer-checked:bg-yellow-50 peer-checked:border-yellow-400',
                  '3': 'border-red-200 text-red-500 peer-checked:bg-red-50 peer-checked:border-red-400',
                }
                return (
                  <label key={p} className="flex-1 cursor-pointer">
                    <input {...register('priority')} type="radio" value={p} className="peer sr-only" />
                    <div className={`text-center py-1.5 text-sm font-medium border rounded-lg transition-colors ${colors[p]}`}>
                      {labels[p]}
                    </div>
                  </label>
                )
              })}
            </div>
          </Field>

          {/* 职位链接 */}
          <Field label="职位链接" error={errors.job_url?.message}>
            <input {...register('job_url')} placeholder="https://..." className={ic(!!errors.job_url)} />
          </Field>

          {/* 备注 */}
          <Field label="备注">
            <textarea
              {...register('notes')}
              rows={2}
              placeholder="准备事项、面试重点..."
              className={`${ic(false)} resize-none`}
            />
          </Field>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
              取消
            </button>
            <button type="submit" disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
              {loading ? '保存中...' : '创建申请'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error ? <p className="mt-1 text-xs text-red-500">{error}</p> : null}
    </div>
  )
}

function ic(hasError: boolean) {
  return `w-full px-3 py-2 rounded-lg border text-sm outline-none transition-colors ${
    hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-2 focus:ring-red-100'
      : 'border-gray-200 focus:border-blue-400 focus:ring-2 focus:ring-blue-50'
  }`
}
