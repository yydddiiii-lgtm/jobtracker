import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { format, parseISO } from 'date-fns'
import apiClient from '../api/client'
import { toast } from '../store/toastStore'
import { handleApiError } from '../utils/apiError'
import type { Interview } from '../types'

const schema = z.object({
  round: z.string().min(1, '请填写面试轮次'),
  interview_time: z.string().min(1, '请选择面试时间'),
  interview_type: z.enum(['online', 'onsite', 'phone'] as const),
  location: z.string().optional(),
  interviewer: z.string().optional(),
  prep_notes: z.string().optional(),
})

type FormData = z.infer<typeof schema>

const RESULT_LABELS: Record<string, { label: string; class: string }> = {
  pending:   { label: '待出结果', class: 'bg-gray-100 text-gray-500' },
  passed:    { label: '通过',    class: 'bg-green-50 text-green-600' },
  failed:    { label: '未通过',  class: 'bg-red-50 text-red-500' },
  cancelled: { label: '已取消',  class: 'bg-gray-100 text-gray-400' },
}

const TYPE_LABELS: Record<string, string> = {
  online: '线上',
  onsite: '线下',
  phone:  '电话',
}

interface Props {
  applicationId: string
  interviews: Interview[]
  onUpdate: (list: Interview[]) => void
}

export default function InterviewPanel({ applicationId, interviews, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { interview_type: 'online' },
  })

  const onSubmit = async (data: FormData) => {
    setLoading(true)
    try {
      const res = await apiClient.post(`/applications/${applicationId}/interviews`, data)
      onUpdate([...interviews, res.data.data.interview])
      toast.success('面试记录已添加')
      reset()
      setShowForm(false)
    } catch (err) {
      handleApiError(err, '添加面试失败')
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateResult = async (interviewId: string, result: string) => {
    try {
      await apiClient.patch(`/interviews/${interviewId}`, { result })
      onUpdate(interviews.map((i) => i.id === interviewId ? { ...i, result: result as Interview['result'] } : i))
    } catch (err) {
      handleApiError(err, '更新失败')
    }
  }

  return (
    <div>
      {interviews.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400 text-center py-4">暂无面试记录</p>
      ) : null}

      {interviews.map((interview) => {
        const result = RESULT_LABELS[interview.result] ?? RESULT_LABELS.pending
        return (
          <div key={interview.id} className="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
            <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <span className="text-xs font-bold text-blue-600">
                {TYPE_LABELS[interview.interview_type] ?? '?'}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-sm text-gray-900">{interview.round}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${result.class}`}>
                  {result.label}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                {format(parseISO(interview.interview_time), 'yyyy-MM-dd HH:mm')}
                {interview.interviewer ? ` · ${interview.interviewer}` : ''}
                {interview.location ? ` · ${interview.location}` : ''}
              </p>
              {interview.prep_notes ? (
                <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded p-2">{interview.prep_notes}</p>
              ) : null}
            </div>
            <select
              value={interview.result}
              onChange={(e) => handleUpdateResult(interview.id, e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-blue-400 shrink-0"
            >
              <option value="pending">待出结果</option>
              <option value="passed">通过</option>
              <option value="failed">未通过</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        )
      })}

      {showForm ? (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">轮次 *</label>
              <input {...register('round')} placeholder="一面、技术面..." className={inp} />
              {errors.round ? <p className="text-xs text-red-500 mt-1">{errors.round.message}</p> : null}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">形式 *</label>
              <select {...register('interview_type')} className={inp}>
                <option value="online">线上</option>
                <option value="onsite">线下</option>
                <option value="phone">电话</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">面试时间 *</label>
              <input {...register('interview_time')} type="datetime-local" className={inp} />
              {errors.interview_time ? <p className="text-xs text-red-500 mt-1">{errors.interview_time.message}</p> : null}
            </div>
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">面试官</label>
              <input {...register('interviewer')} placeholder="可选" className={inp} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">地点（线下填写）</label>
            <input {...register('location')} placeholder="公司地址" className={inp} />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">准备笔记</label>
            <textarea {...register('prep_notes')} rows={2} className={`${inp} resize-none`} placeholder="复习重点、注意事项..." />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? '保存中...' : '保存'}
            </button>
            <button type="button" onClick={() => { setShowForm(false); reset() }}
              className="px-3 py-1.5 border border-gray-300 text-gray-600 rounded-lg text-xs font-medium hover:bg-white">
              取消
            </button>
          </div>
        </form>
      ) : (
        <button
          onClick={() => setShowForm(true)}
          className="mt-3 w-full py-2 border border-dashed border-gray-300 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-500 transition-colors"
        >
          + 添加面试记录
        </button>
      )}
    </div>
  )
}

const inp = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white'
