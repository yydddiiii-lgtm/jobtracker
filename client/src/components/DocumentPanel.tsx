import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import apiClient from '../api/client'
import { toast } from '../store/toastStore'
import { handleApiError } from '../utils/apiError'
import type { Document } from '../types'

const DOC_TYPES = ['简历', '成绩单', '英语成绩证明', '推荐信', '作品集', '在校证明', '其他']

interface Props {
  applicationId: string
  documents: Document[]
  onUpdate: (list: Document[]) => void
}

export default function DocumentPanel({ applicationId, documents, onUpdate }: Props) {
  const [showForm, setShowForm] = useState(false)
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, reset } = useForm<{ doc_type: string; notes: string }>()

  const onSubmit = async (data: { doc_type: string; notes: string }) => {
    setLoading(true)
    try {
      const res = await apiClient.post(`/applications/${applicationId}/documents`, data)
      onUpdate([...documents, res.data.data.document])
      toast.success('材料已添加')
      reset()
      setShowForm(false)
    } catch (err) {
      handleApiError(err, '添加材料失败')
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = async (doc: Document) => {
    try {
      const res = await apiClient.patch(`/documents/${doc.id}`, {
        is_submitted: !doc.is_submitted,
      })
      onUpdate(documents.map((d) => d.id === doc.id ? res.data.data.document : d))
    } catch (err) {
      handleApiError(err, '更新失败')
    }
  }

  const handleDelete = async (docId: string) => {
    try {
      await apiClient.delete(`/documents/${docId}`)
      onUpdate(documents.filter((d) => d.id !== docId))
      toast.success('已删除')
    } catch (err) {
      handleApiError(err, '删除失败')
    }
  }

  return (
    <div>
      {documents.length === 0 && !showForm ? (
        <p className="text-sm text-gray-400 text-center py-4">暂无材料记录</p>
      ) : null}

      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center gap-3 py-2.5 px-3 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors"
          >
            <input
              type="checkbox"
              checked={doc.is_submitted}
              onChange={() => handleToggle(doc)}
              className="w-4 h-4 rounded border-gray-300 text-blue-600 cursor-pointer"
            />
            <div className="flex-1 min-w-0">
              <span className={`text-sm font-medium ${doc.is_submitted ? 'line-through text-gray-400' : 'text-gray-800'}`}>
                {doc.doc_type}
              </span>
              {doc.notes ? (
                <span className="ml-2 text-xs text-gray-400">{doc.notes}</span>
              ) : null}
              {doc.submitted_at ? (
                <span className="ml-2 text-xs text-green-500">
                  已提交 {format(parseISO(doc.submitted_at), 'MM-dd')}
                </span>
              ) : null}
            </div>
            <button
              onClick={() => handleDelete(doc.id)}
              className="text-gray-300 hover:text-red-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>

      {showForm ? (
        <form onSubmit={handleSubmit(onSubmit)} className="mt-4 border border-gray-200 rounded-xl p-4 space-y-3 bg-gray-50">
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">材料类型</label>
            <select {...register('doc_type')} className={inp}>
              {DOC_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">备注</label>
            <input {...register('notes')} placeholder="可选备注" className={inp} />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={loading}
              className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50">
              {loading ? '保存中...' : '添加'}
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
          + 添加材料
        </button>
      )}
    </div>
  )
}

const inp = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white'
