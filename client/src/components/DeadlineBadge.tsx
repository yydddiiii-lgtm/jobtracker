import { getDeadlineStatus, getDeadlineLabel, deadlineBadgeMap } from '../utils/deadline'

export default function DeadlineBadge({ deadline }: { deadline: string | null }) {
  const status = getDeadlineStatus(deadline)
  if (status === 'none') return null

  const label = getDeadlineLabel(deadline)
  const colorClass = deadlineBadgeMap[status]

  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
      <span className={status === 'expired' ? 'line-through' : ''}>{label}</span>
    </span>
  )
}
