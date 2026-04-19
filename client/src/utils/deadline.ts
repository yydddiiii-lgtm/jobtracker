import { differenceInDays, parseISO, isValid, startOfDay } from 'date-fns'

export type DeadlineStatus = 'expired' | 'urgent' | 'warning' | 'safe' | 'none'

export function getDeadlineStatus(deadline: string | null): DeadlineStatus {
  if (!deadline) return 'none'
  const date = parseISO(deadline)
  if (!isValid(date)) return 'none'
  const diff = differenceInDays(startOfDay(date), startOfDay(new Date()))
  if (diff < 0) return 'expired'
  if (diff <= 2) return 'urgent'
  if (diff <= 7) return 'warning'
  return 'safe'
}

export function getDeadlineLabel(deadline: string | null): string | null {
  if (!deadline) return null
  const date = parseISO(deadline)
  if (!isValid(date)) return null
  const diff = differenceInDays(startOfDay(date), startOfDay(new Date()))
  if (diff < 0) return '已过期'
  if (diff === 0) return '今天截止'
  return `${diff}天后`
}

export const deadlineColorMap: Record<DeadlineStatus, string> = {
  expired: 'text-gray-400 line-through',
  urgent:  'text-red-600',
  warning: 'text-orange-500',
  safe:    'text-green-600',
  none:    '',
}

export const deadlineBadgeMap: Record<DeadlineStatus, string> = {
  expired: 'bg-gray-100 text-gray-400',
  urgent:  'bg-red-50 text-red-600',
  warning: 'bg-orange-50 text-orange-500',
  safe:    'bg-green-50 text-green-600',
  none:    '',
}
