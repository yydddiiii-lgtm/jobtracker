import { useEffect, useState } from 'react'
import {
  ResponsiveContainer, FunnelChart, Funnel, LabelList, Tooltip,
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts'
import { statsApi } from '../api/stats'
import { handleApiError } from '../utils/apiError'
import { STAGE_LABELS } from '../utils/stage'
import type { StatsOverview } from '../types'

const STAGE_COLORS = [
  '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899',
  '#EF4444', '#F59E0B', '#10B981', '#6B7280', '#9CA3AF',
]
const PIE_COLORS = ['#3B82F6', '#10B981']

export default function Stats() {
  const [data, setData] = useState<StatsOverview | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await statsApi.overview()
        setData(res.data.data)
      } catch (err) {
        handleApiError(err, '加载统计数据失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">加载中...</div>
    )
  }

  if (!data) return null

  const total = Object.values(data.stageCounts).reduce((a, b) => a + (b ?? 0), 0)
  const offerCount = data.stageCounts['offer'] ?? 0
  const offerRate = total > 0 ? ((offerCount / total) * 100).toFixed(1) : '0.0'

  // 漏斗图数据（过滤 0 值、排除终态）
  const funnelData = Object.entries(data.stageCounts)
    .filter(([stage]) => !['rejected', 'withdrawn'].includes(stage))
    .map(([stage, count], i) => ({
      name: STAGE_LABELS[stage as keyof typeof STAGE_LABELS] ?? stage,
      value: count ?? 0,
      fill: STAGE_COLORS[i % STAGE_COLORS.length],
    }))
    .filter((d) => d.value > 0)

  // 折线图数据
  const trendData = data.weeklyTrend.map((d) => ({
    week: d.week.slice(0, 10),
    count: d.count,
  }))

  // 饼图数据
  const pieData = [
    { name: '校招', value: data.byJobType.campus ?? 0 },
    { name: '实习', value: data.byJobType.internship ?? 0 },
  ].filter((d) => d.value > 0)

  const hasData = total > 0

  return (
    <div className="px-6 py-4 space-y-6 overflow-y-auto h-full">
      <h2 className="font-semibold text-gray-900">统计概览</h2>

      {!hasData ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-gray-400 text-sm">还没有足够数据，多投几家吧~</p>
        </div>
      ) : (
        <>
          {/* 数字卡片 */}
          <div className="grid grid-cols-3 gap-4">
            <StatCard label="总投递数" value={total} unit="条" color="blue" />
            <StatCard label="Offer 数" value={offerCount} unit="个" color="green" />
            <StatCard label="Offer 率" value={`${offerRate}%`} color="purple" />
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-2 gap-4">
            {/* 漏斗图 */}
            <ChartCard title="申请漏斗">
              {funnelData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <FunnelChart>
                    <Tooltip formatter={(v) => [`${v} 条`, '数量']} />
                    <Funnel dataKey="value" data={funnelData} isAnimationActive>
                      <LabelList position="center" fill="#fff" fontSize={12}
                        formatter={(v: any) => v > 0 ? v : ''} />
                    </Funnel>
                  </FunnelChart>
                </ResponsiveContainer>
              ) : (
                <Empty />
              )}
            </ChartCard>

            {/* 饼图 */}
            <ChartCard title="校招 vs 实习">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      outerRadius={90}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend />
                    <Tooltip formatter={(v) => [`${v} 条`, '数量']} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Empty />
              )}
            </ChartCard>
          </div>

          {/* 折线图（全宽） */}
          <ChartCard title="每周投递趋势">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ left: -10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="week" tick={{ fontSize: 11 }} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v) => [`${v} 条`, '投递数']} />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    dot={{ r: 4, fill: '#3B82F6' }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Empty />
            )}
          </ChartCard>

          {/* 各阶段明细表 */}
          <ChartCard title="各阶段明细">
            <div className="space-y-2 pt-1">
              {Object.entries(data.stageCounts).map(([stage, count]) => {
                const pct = total > 0 ? ((count ?? 0) / total) * 100 : 0
                return (
                  <div key={stage} className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16 shrink-0">
                      {STAGE_LABELS[stage as keyof typeof STAGE_LABELS] ?? stage}
                    </span>
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium text-gray-700 w-8 text-right shrink-0">
                      {count ?? 0}
                    </span>
                  </div>
                )
              })}
            </div>
          </ChartCard>
        </>
      )}
    </div>
  )
}

function StatCard({
  label, value, unit, color,
}: {
  label: string
  value: number | string
  unit?: string
  color: 'blue' | 'green' | 'purple'
}) {
  const colors = {
    blue:   'bg-blue-50 text-blue-600',
    green:  'bg-green-50 text-green-600',
    purple: 'bg-purple-50 text-purple-600',
  }
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <p className="text-xs font-medium text-gray-500 mb-2">{label}</p>
      <p className={`text-3xl font-bold ${colors[color]}`}>
        {value}
        {unit ? <span className="text-base font-medium ml-1">{unit}</span> : null}
      </p>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <h3 className="text-sm font-semibold text-gray-700 mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Empty() {
  return (
    <div className="flex items-center justify-center h-32 text-xs text-gray-400">暂无数据</div>
  )
}
