import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { applicationsApi } from '../api/applications'
import apiClient from '../api/client'
import { handleApiError } from '../utils/apiError'
import type { Application, Interview } from '../types'
import { FullScreenCalendar } from '@/components/ui/fullscreen-calendar'
import type { CalendarData, CalendarEvent } from '@/components/ui/fullscreen-calendar'

export default function Calendar() {
  const navigate = useNavigate()
  const [calendarData, setCalendarData] = useState<CalendarData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const load = async () => {
      try {
        const [appsRes, intRes] = await Promise.all([
          applicationsApi.list({ no_pagination: 'true' }),
          apiClient.get('/interviews'),
        ])
        const apps: Application[] = appsRes.data.data.rows
        const interviews: Interview[] = intRes.data.data.interviews ?? []

        const eventMap = new Map<string, CalendarEvent[]>()

        const addEvent = (date: Date, event: CalendarEvent) => {
          const key = date.toDateString()
          if (!eventMap.has(key)) eventMap.set(key, [])
          eventMap.get(key)!.push(event)
        }

        apps.filter((a) => a.deadline).forEach((a) => {
          const date = new Date(a.deadline!)
          addEvent(date, {
            id: `deadline-${a.id}`,
            name: `${a.company_name} 截止`,
            time: '截止日期',
            datetime: a.deadline!,
            applicationId: String(a.id),
            color: 'red',
          })
        })

        interviews.forEach((i) => {
          const date = new Date(i.interview_time)
          const hhmm = date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })
          addEvent(date, {
            id: `interview-${i.id}`,
            name: i.round,
            time: hhmm,
            datetime: i.interview_time,
            applicationId: String(i.application_id),
            color: 'blue',
          })
        })

        const data: CalendarData[] = Array.from(eventMap.entries()).map(([, events]) => ({
          day: new Date(events[0].datetime),
          events,
        }))

        setCalendarData(data)
      } catch (err) {
        handleApiError(err, '加载日历数据失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleEventClick = (event: CalendarEvent) => {
    if (event.applicationId) navigate(`/applications/${event.applicationId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">加载中...</div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <FullScreenCalendar data={calendarData} onEventClick={handleEventClick} />
    </div>
  )
}
