import { useEffect, useState } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import { useNavigate } from 'react-router-dom'
import { applicationsApi } from '../api/applications'
import apiClient from '../api/client'
import { handleApiError } from '../utils/apiError'
import type { Application, Interview } from '../types'

export default function Calendar() {
  const navigate = useNavigate()
  const [events, setEvents] = useState<any[]>([])
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

        const deadlineEvents = apps
          .filter((a) => a.deadline)
          .map((a) => ({
            id: `deadline-${a.id}`,
            title: `📅 ${a.company_name} 截止`,
            date: a.deadline,
            backgroundColor: '#EF4444',
            borderColor: '#EF4444',
            textColor: '#fff',
            extendedProps: { applicationId: a.id },
          }))

        const interviewEvents = interviews.map((i) => ({
          id: `interview-${i.id}`,
          title: `🎤 ${i.round}`,
          start: i.interview_time,
          backgroundColor: '#3B82F6',
          borderColor: '#3B82F6',
          textColor: '#fff',
          extendedProps: { applicationId: i.application_id },
        }))

        setEvents([...deadlineEvents, ...interviewEvents])
      } catch (err) {
        handleApiError(err, '加载日历数据失败')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleEventClick = (info: any) => {
    const { applicationId } = info.event.extendedProps
    if (applicationId) navigate(`/applications/${applicationId}`)
  }

  return (
    <div className="px-6 py-4 h-full">
      <h2 className="font-semibold text-gray-900 mb-4">日历视图</h2>
      {loading ? (
        <div className="flex items-center justify-center h-64 text-gray-400 text-sm">加载中...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 p-4">
          <FullCalendar
            plugins={[dayGridPlugin, interactionPlugin]}
            initialView="dayGridMonth"
            locale="zh-cn"
            events={events}
            eventClick={handleEventClick}
            headerToolbar={{
              left: 'prev,next today',
              center: 'title',
              right: 'dayGridMonth',
            }}
            buttonText={{ today: '今天', month: '月' }}
            height="auto"
            eventDisplay="block"
            dayMaxEvents={3}
          />
        </div>
      )}
    </div>
  )
}
