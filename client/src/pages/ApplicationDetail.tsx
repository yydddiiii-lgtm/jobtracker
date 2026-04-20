import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { applicationsApi } from '../api/applications'
import { useAppStore } from '../store/appStore'
import { toast } from '../store/toastStore'
import { handleApiError } from '../utils/apiError'
import { STAGE_LABELS, STAGE_ORDER, TERMINAL_STAGES } from '../utils/stage'
import { format, parseISO } from 'date-fns'
import type { Application, StageLog, Interview, Document, Offer } from '../types'
import Spinner from '../components/Spinner'
import DeadlineBadge from '../components/DeadlineBadge'
import InterviewPanel from '../components/InterviewPanel'
import DocumentPanel from '../components/DocumentPanel'
import apiClient from '../api/client'

const PRIORITY_MAP: Record<string, { label: string; class: string }> = {
  '3': { label: '高优先级', class: 'bg-red-50 text-red-600 border border-red-200' },
  '2': { label: '中优先级', class: 'bg-yellow-50 text-yellow-600 border border-yellow-200' },
  '1': { label: '低优先级', class: 'bg-gray-100 text-gray-500 border border-gray-200' },
}

const JOB_TYPE_LABELS: Record<string, string> = {
  daily_internship: '日常实习',
  summer_internship: '暑期实习',
  winter_internship: '寒假实习',
  fulltime: '正式岗位',
  campus: '校园招聘',
  internship: '实习',
}

export default function ApplicationDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const updateApplication = useAppStore((s) => s.updateApplication)

  const [app, setApp] = useState<Application | null>(null)
  const [stageLogs, setStageLogs] = useState<StageLog[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [offer, setOffer] = useState<Offer | null>(null)
  const [loading, setLoading] = useState(true)
  const [editMode, setEditMode] = useState(false)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<'timeline' | 'interviews' | 'documents'>('timeline')

  const { register, handleSubmit, reset } = useForm<Partial<Application>>()

  useEffect(() => {
    if (!id) return
    const load = async () => {
      setLoading(true)
      try {
        const [appRes, logsRes, intRes, docRes, offerRes] = await Promise.all([
          applicationsApi.getById(id),
          applicationsApi.getStageLogs(id),
          apiClient.get(`/applications/${id}/interviews`),
          apiClient.get(`/applications/${id}/documents`),
          apiClient.get(`/applications/${id}/offer`),
        ])
        setApp(appRes.data.data.application)
        setStageLogs(logsRes.data.data.stage_logs ?? [])
        setInterviews(intRes.data.data.interviews ?? [])
        setDocuments(docRes.data.data.documents ?? [])
        setOffer(offerRes.data.data.offer)
        reset(appRes.data.data.application)
      } catch (err) {
        handleApiError(err, '加载申请详情失败')
        navigate('/board')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleSave = async (data: Partial<Application>) => {
    if (!app) return
    setSaving(true)
    try {
      const res = await applicationsApi.update(app.id, data)
      const updated = res.data.data.application
      setApp(updated)
      updateApplication(app.id, updated)
      toast.success('保存成功')
      setEditMode(false)
    } catch (err) {
      handleApiError(err, '保存失败')
    } finally {
      setSaving(false)
    }
  }

  const handleStageChange = async (newStage: string) => {
    if (!app) return
    try {
      const res = await applicationsApi.update(app.id, { stage: newStage as Application['stage'] })
      const updated = res.data.data.application
      setApp(updated)
      updateApplication(app.id, updated)
      const logsRes = await applicationsApi.getStageLogs(app.id)
      setStageLogs(logsRes.data.data.stage_logs ?? [])
      toast.success('阶段已更新')
    } catch (err) {
      handleApiError(err, '更新阶段失败')
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center h-full">
        <Spinner className="w-8 h-8" />
      </div>
    )
  }

  if (!app) return null

  const priority = PRIORITY_MAP[app.priority] ?? PRIORITY_MAP['2']
  const stageIndex = STAGE_ORDER.indexOf(app.stage)
  const isTerminal = TERMINAL_STAGES.includes(app.stage)

  return (
    <div className="max-w-4xl mx-auto px-6 py-6">
      {/* 返回 */}
      <button
        onClick={() => navigate('/board')}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-5 transition-colors group"
      >
        <svg className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        返回看板
      </button>

      {/* 主信息卡 */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-4 shadow-sm">
        {/* 顶部：公司、职位、标签、操作 */}
        <div className="flex items-start justify-between gap-4 mb-5">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap mb-1">
              <h1 className="text-2xl font-bold text-gray-900">{app.company_name}</h1>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${priority.class}`}>
                {priority.label}
              </span>
            </div>
            <p className="text-gray-500 text-sm">{app.position}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <DeadlineBadge deadline={app.deadline} />
            {editMode ? (
              <button
                onClick={() => { setEditMode(false); reset(app) }}
                className="px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                取消
              </button>
            ) : (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-300 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                编辑
              </button>
            )}
          </div>
        </div>

        {/* 阶段步进器 */}
        <div className="mb-5">
          <div className="flex items-center gap-0">
            {STAGE_ORDER.filter(s => !TERMINAL_STAGES.includes(s)).map((s, i, arr) => {
              const idx = STAGE_ORDER.indexOf(s)
              const isCurrent = app.stage === s
              const isPast = !isTerminal && stageIndex > idx
              return (
                <div key={s} className="flex items-center flex-1">
                  <button
                    onClick={() => !isCurrent && handleStageChange(s)}
                    title={STAGE_LABELS[s]}
                    className={`flex flex-col items-center gap-1 flex-1 py-1 rounded-lg transition-colors ${
                      isCurrent ? 'opacity-100' : 'hover:bg-gray-50 opacity-80'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-2 ring-blue-200'
                        : isPast
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-100 text-gray-400'
                    }`}>
                      {isPast ? '✓' : i + 1}
                    </div>
                    <span className={`text-[10px] font-medium leading-tight text-center ${
                      isCurrent ? 'text-blue-600' : isPast ? 'text-green-600' : 'text-gray-400'
                    }`}>
                      {STAGE_LABELS[s]}
                    </span>
                  </button>
                  {i < arr.length - 1 && (
                    <div className={`h-px w-3 shrink-0 ${isPast ? 'bg-green-300' : 'bg-gray-200'}`} />
                  )}
                </div>
              )
            })}
            {/* 终态按钮 */}
            <div className="flex gap-1 ml-2 shrink-0">
              {TERMINAL_STAGES.map(s => (
                <button
                  key={s}
                  onClick={() => app.stage !== s && handleStageChange(s)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-colors ${
                    app.stage === s
                      ? s === 'rejected' ? 'bg-red-100 text-red-600' : 'bg-gray-200 text-gray-600'
                      : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  {STAGE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Offer 接受状态 */}
        {offer && (
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs text-gray-400">Offer 决定：</span>
            {offer.is_accepted === true && (
              <span className="px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-xs font-medium border border-green-200">已接受 🎉</span>
            )}
            {offer.is_accepted === false && (
              <span className="px-2 py-0.5 bg-red-50 text-red-500 rounded-full text-xs font-medium border border-red-200">已拒绝</span>
            )}
            {offer.is_accepted === null && (
              <span className="px-2 py-0.5 bg-gray-100 text-gray-400 rounded-full text-xs">待决定</span>
            )}
            {offer.base_salary && (
              <span className="text-xs text-gray-500">· {offer.base_salary.toLocaleString()} 元/月</span>
            )}
            {offer.city && offer.city !== app.city && (
              <span className="text-xs text-gray-500">· {offer.city}</span>
            )}
          </div>
        )}

        {/* 信息展示 / 编辑 */}
        {editMode ? (
          <form onSubmit={handleSubmit(handleSave)} className="space-y-3 pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-3">
              <Field label="公司名"><input {...register('company_name')} className={inp} /></Field>
              <Field label="岗位"><input {...register('position')} className={inp} /></Field>
              <Field label="城市"><input {...register('city')} className={inp} /></Field>
              <Field label="截止日期"><input {...register('deadline')} type="date" className={inp} /></Field>
              <Field label="薪资下限（元/月）"><input {...register('salary_min')} type="number" className={inp} /></Field>
              <Field label="薪资上限（元/月）"><input {...register('salary_max')} type="number" className={inp} /></Field>
              <Field label="类型">
                <select {...register('job_type')} className={inp}>
                  <option value="daily_internship">日常实习</option>
                  <option value="summer_internship">暑期实习</option>
                  <option value="winter_internship">寒假实习</option>
                  <option value="fulltime">正式岗位</option>
                </select>
              </Field>
              <Field label="优先级">
                <select {...register('priority')} className={inp}>
                  <option value="1">低</option>
                  <option value="2">中</option>
                  <option value="3">高</option>
                </select>
              </Field>
            </div>
            <Field label="内推码"><input {...register('referral_code')} className={inp} placeholder="如有内推码请填写" /></Field>
            <Field label="职位链接"><input {...register('job_url')} className={inp} placeholder="https://..." /></Field>
            <Field label="备注"><textarea {...register('notes')} rows={3} className={`${inp} resize-none`} /></Field>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors">
                {saving ? '保存中...' : '保存'}
              </button>
              <button type="button" onClick={() => { setEditMode(false); reset(app) }}
                className="px-4 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                取消
              </button>
            </div>
          </form>
        ) : (
          <div className="pt-3 border-t border-gray-100">
            <div className="grid grid-cols-2 gap-x-8 gap-y-3 text-sm mb-3">
              <InfoRow icon="📍" label="城市" value={app.city} />
              <InfoRow icon="💼" label="类型" value={JOB_TYPE_LABELS[app.job_type]} />
              <InfoRow
                icon="💰" label="薪资范围"
                value={app.salary_min || app.salary_max
                  ? `${app.salary_min ?? '?'} - ${app.salary_max ?? '?'} 元/月`
                  : null}
              />
              <InfoRow
                icon="📅" label="截止日期"
                value={app.deadline ? format(parseISO(app.deadline), 'yyyy-MM-dd') : null}
              />
            </div>
            {app.job_url && (
              <div className="flex items-start gap-2 text-sm mb-2">
                <span className="text-gray-400 shrink-0 mt-0.5">🔗</span>
                <div className="min-w-0 flex-1">
                  <span className="text-gray-400 text-xs">职位链接</span>
                  <div className="overflow-hidden">
                    <a href={app.job_url} target="_blank" rel="noreferrer"
                      className="block truncate text-blue-500 hover:text-blue-700 text-sm transition-colors">
                      {app.job_url}
                    </a>
                  </div>
                </div>
              </div>
            )}
            {app.notes && (
              <div className="mt-3">
                <p className="text-xs text-gray-400 mb-1">📝 备注</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-3 leading-relaxed">
                  {app.notes}
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 子面板 */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm">
        <div className="flex border-b border-gray-100">
          {([
            { key: 'timeline', label: '阶段历史', count: stageLogs.length },
            { key: 'interviews', label: '面试记录', count: interviews.length },
            { key: 'documents', label: '材料清单', count: documents.length },
          ] as const).map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-colors border-b-2 ${
                activeTab === key
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {label}
              <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full min-w-[20px] text-center ${
                activeTab === key ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'
              }`}>
                {count}
              </span>
            </button>
          ))}
        </div>

        <div className="p-5 min-h-[200px]">
          {activeTab === 'timeline' ? (
            <StageTimeline logs={stageLogs} />
          ) : activeTab === 'interviews' ? (
            <InterviewPanel applicationId={app.id} interviews={interviews} onUpdate={setInterviews} />
          ) : (
            <DocumentPanel applicationId={app.id} documents={documents} onUpdate={setDocuments} />
          )}
        </div>
      </div>
    </div>
  )
}

function StageTimeline({ logs }: { logs: StageLog[] }) {
  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center mb-2">
          <span className="text-lg">📋</span>
        </div>
        <p className="text-sm text-gray-400">暂无阶段记录</p>
      </div>
    )
  }
  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" />
      {[...logs].reverse().map((log) => (
        <div key={log.id} className="relative mb-5 last:mb-0">
          <div className="absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-white" />
          <p className="text-sm font-medium text-gray-800 leading-snug">
            {log.from_stage
              ? <><span className="text-gray-400">{STAGE_LABELS[log.from_stage]}</span><span className="text-gray-300 mx-1.5">→</span></>
              : null}
            <span className="text-blue-600">{STAGE_LABELS[log.to_stage]}</span>
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {format(parseISO(log.changed_at), 'yyyy-MM-dd HH:mm')}
          </p>
          {log.note && <p className="text-xs text-gray-500 mt-1 bg-gray-50 rounded px-2 py-1">{log.note}</p>}
        </div>
      ))}
    </div>
  )
}

function InfoRow({ icon, label, value }: { icon: string; label: string; value?: string | null }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-base shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs text-gray-400">{label}</p>
        <p className="text-sm text-gray-800 font-medium">{value ?? '—'}</p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      {children}
    </div>
  )
}

const inp = 'w-full px-3 py-2 rounded-lg border border-gray-200 text-sm outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-colors'
