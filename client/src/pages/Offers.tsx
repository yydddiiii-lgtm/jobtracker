import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { format, parseISO, differenceInDays } from 'date-fns'
import apiClient from '../api/client'
import { handleApiError } from '../utils/apiError'
import { toast } from '../store/toastStore'
import type { Offer } from '../types'

const HEADCOUNT_LABELS: Record<string, string> = {
  regular: '正式',
  outsourced: '外包',
  contract: '合同',
}

interface EditForm {
  base_salary: string
  city: string
  department: string
  headcount_type: string
  offer_deadline: string
  notes: string
}

export default function Offers() {
  const navigate = useNavigate()
  const [offers, setOffers] = useState<Offer[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<EditForm>({
    base_salary: '', city: '', department: '', headcount_type: '', offer_deadline: '', notes: '',
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient.get('/offers')
        setOffers(res.data.data.offers ?? [])
      } catch (err) {
        handleApiError(err, '加载 Offer 列表失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleDecision = async (offerId: string, applicationId: string, accepted: boolean | null) => {
    try {
      await apiClient.patch(`/applications/${applicationId}/offer`, { is_accepted: accepted })
      setOffers((prev) => prev.map((o) => o.id === offerId ? { ...o, is_accepted: accepted } : o))
      toast.success(accepted === null ? '已撤回决定' : accepted ? '已标记接受 🎉' : '已标记拒绝')
    } catch (err) {
      handleApiError(err, '操作失败')
    }
  }

  const startEdit = (offer: Offer) => {
    setEditingId(offer.id)
    setEditForm({
      base_salary: offer.base_salary?.toString() ?? '',
      city: offer.city ?? '',
      department: offer.department ?? '',
      headcount_type: offer.headcount_type ?? '',
      offer_deadline: offer.offer_deadline ? offer.offer_deadline.slice(0, 10) : '',
      notes: offer.notes ?? '',
    })
  }

  const handleSave = async (offer: Offer) => {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {
        city: editForm.city || null,
        department: editForm.department || null,
        headcount_type: editForm.headcount_type || null,
        offer_deadline: editForm.offer_deadline || null,
        notes: editForm.notes || null,
        base_salary: editForm.base_salary ? parseInt(editForm.base_salary) : null,
      }
      const res = await apiClient.patch(`/offers/${offer.id}`, payload)
      setOffers((prev) => prev.map((o) => o.id === offer.id ? { ...o, ...res.data.data.offer } : o))
      toast.success('Offer 信息已保存')
      setEditingId(null)
    } catch (err) {
      handleApiError(err, '保存失败')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400 text-sm">加载中...</div>
  )

  if (offers.length === 0) return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
      <div className="w-36 h-36 rounded-2xl bg-yellow-50 flex items-center justify-center">
        <svg className="w-16 h-16 text-yellow-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 text-lg">还没有收到 Offer</h3>
        <p className="text-gray-400 text-sm mt-1">继续加油，好 Offer 就在前方！</p>
      </div>
      <button onClick={() => navigate('/board')}
        className="px-5 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors">
        回到看板
      </button>
    </div>
  )

  return (
    <div className="px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-gray-900">Offer 对比</h2>
        <span className="text-sm text-gray-400">{offers.length} 个 Offer</span>
      </div>

      <div className="space-y-3">
        {offers.map((offer) => {
          const deadlineDiff = offer.offer_deadline
            ? differenceInDays(parseISO(offer.offer_deadline), new Date()) : null
          const deadlineUrgent = deadlineDiff !== null && deadlineDiff <= 7
          const isEditing = editingId === offer.id

          return (
            <div key={offer.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
              {/* 顶部行：公司 + 状态 + 操作按钮 */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate(`/applications/${offer.application_id}`)}
                    className="text-base font-bold text-gray-900 hover:text-blue-600 transition-colors"
                  >
                    {offer.company_name ?? '未知公司'}
                  </button>
                  <span className="text-sm text-gray-400">{offer.position ?? '—'}</span>
                  {offer.is_accepted === true && (
                    <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-xs font-medium border border-green-200">已接受</span>
                  )}
                  {offer.is_accepted === false && (
                    <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-full text-xs font-medium border border-red-200">已拒绝</span>
                  )}
                  {offer.is_accepted === null && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-xs">待决定</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {offer.is_accepted === null && (
                    <>
                      <button onClick={() => handleDecision(offer.id, offer.application_id, true)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
                        接受
                      </button>
                      <button onClick={() => handleDecision(offer.id, offer.application_id, false)}
                        className="px-3 py-1.5 border border-red-300 text-red-500 rounded-lg text-xs font-medium hover:bg-red-50 transition-colors">
                        拒绝
                      </button>
                    </>
                  )}
                  {offer.is_accepted !== null && (
                    <button
                      onClick={() => handleDecision(offer.id, offer.application_id, null)}
                      className="text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 border border-gray-200 rounded-lg">
                      撤回决定
                    </button>
                  )}
                  <button
                    onClick={() => isEditing ? setEditingId(null) : startEdit(offer)}
                    className="px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-50 transition-colors"
                  >
                    {isEditing ? '取消' : '编辑详情'}
                  </button>
                </div>
              </div>

              {/* 详情信息 */}
              {isEditing ? (
                <div className="px-5 py-4 bg-gray-50">
                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">月薪（元）</label>
                      <input type="number" value={editForm.base_salary} placeholder="如 15000"
                        onChange={(e) => setEditForm(f => ({ ...f, base_salary: e.target.value }))}
                        className={inp} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">城市</label>
                      <input value={editForm.city} placeholder="如 北京"
                        onChange={(e) => setEditForm(f => ({ ...f, city: e.target.value }))}
                        className={inp} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">部门</label>
                      <input value={editForm.department} placeholder="如 基础架构"
                        onChange={(e) => setEditForm(f => ({ ...f, department: e.target.value }))}
                        className={inp} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">编制</label>
                      <select value={editForm.headcount_type}
                        onChange={(e) => setEditForm(f => ({ ...f, headcount_type: e.target.value }))}
                        className={inp}>
                        <option value="">请选择</option>
                        <option value="regular">正式</option>
                        <option value="outsourced">外包</option>
                        <option value="contract">合同</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">Offer 截止日期</label>
                      <input type="date" value={editForm.offer_deadline}
                        onChange={(e) => setEditForm(f => ({ ...f, offer_deadline: e.target.value }))}
                        className={inp} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 block mb-1">备注</label>
                      <input value={editForm.notes} placeholder="可选"
                        onChange={(e) => setEditForm(f => ({ ...f, notes: e.target.value }))}
                        className={inp} />
                    </div>
                  </div>
                  <button onClick={() => handleSave(offer)} disabled={saving}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                    {saving ? '保存中...' : '保存'}
                  </button>
                </div>
              ) : (
                <div className="px-5 py-4 grid grid-cols-5 gap-4 text-sm">
                  <InfoCell label="月薪" value={offer.base_salary ? `${offer.base_salary.toLocaleString()} 元` : null} />
                  <InfoCell label="城市" value={offer.city} />
                  <InfoCell label="部门" value={offer.department} />
                  <InfoCell label="编制" value={offer.headcount_type ? HEADCOUNT_LABELS[offer.headcount_type] : null} />
                  <InfoCell
                    label="Offer 截止"
                    value={offer.offer_deadline ? format(parseISO(offer.offer_deadline), 'yyyy-MM-dd') : null}
                    urgent={deadlineUrgent}
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function InfoCell({ label, value, urgent }: { label: string; value?: string | null; urgent?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      <p className={`font-medium ${urgent ? 'text-red-600' : 'text-gray-800'}`}>
        {value ?? <span className="text-gray-300 font-normal">未填写</span>}
      </p>
    </div>
  )
}

const inp = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 bg-white transition-colors'
