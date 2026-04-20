import * as React from 'react'
import {
  add,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isEqual,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfToday,
  startOfWeek,
} from 'date-fns'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useMediaQuery } from '@/hooks/use-media-query'

export interface CalendarEvent {
  id: number | string
  name: string
  time: string
  datetime: string
  applicationId?: string
  color?: 'blue' | 'red'
}

export interface CalendarData {
  day: Date
  events: CalendarEvent[]
}

interface FullScreenCalendarProps {
  data: CalendarData[]
  onEventClick?: (event: CalendarEvent) => void
}

const colStartClasses = [
  '',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
]

const WEEK_DAYS = ['日', '一', '二', '三', '四', '五', '六']

export function FullScreenCalendar({ data, onEventClick }: FullScreenCalendarProps) {
  const today = startOfToday()
  const [selectedDay, setSelectedDay] = React.useState(today)
  const [currentMonth, setCurrentMonth] = React.useState(format(today, 'MMM-yyyy'))
  const firstDayCurrentMonth = parse(currentMonth, 'MMM-yyyy', new Date())
  useMediaQuery('(min-width: 768px)')

  const days = eachDayOfInterval({
    start: startOfWeek(firstDayCurrentMonth),
    end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
  })

  function previousMonth() {
    setCurrentMonth(format(add(firstDayCurrentMonth, { months: -1 }), 'MMM-yyyy'))
  }

  function nextMonth() {
    setCurrentMonth(format(add(firstDayCurrentMonth, { months: 1 }), 'MMM-yyyy'))
  }

  function goToToday() {
    setCurrentMonth(format(today, 'MMM-yyyy'))
    setSelectedDay(today)
  }

  const selectedDayEvents = data.filter((d) => isSameDay(d.day, selectedDay)).flatMap((d) => d.events)

  return (
    <div className="flex flex-1 flex-col">
      {/* Header */}
      <div className="flex flex-col space-y-4 p-4 md:flex-row md:items-center md:justify-between md:space-y-0 lg:flex-none">
        <div className="flex flex-auto">
          <div className="flex items-center gap-4">
            <div className="hidden w-16 flex-col items-center justify-center rounded-lg border border-gray-200 bg-gray-100 p-0.5 md:flex">
              <h1 className="p-1 text-xs uppercase text-gray-500">
                {format(today, 'MMM')}
              </h1>
              <div className="flex w-full items-center justify-center rounded-lg border border-gray-200 bg-white p-0.5 text-lg font-bold text-gray-900">
                <span>{format(today, 'd')}</span>
              </div>
            </div>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-gray-900">
                {format(firstDayCurrentMonth, 'yyyy年M月')}
              </h2>
              <p className="text-sm text-gray-500">
                {format(firstDayCurrentMonth, 'M月d日')} —{' '}
                {format(endOfMonth(firstDayCurrentMonth), 'M月d日')}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Separator orientation="vertical" className="hidden h-6 md:block" />
          <div className="inline-flex -space-x-px rounded-lg shadow-sm">
            <Button onClick={previousMonth} variant="outline" size="icon"
              className="rounded-none rounded-l-lg focus-visible:z-10" aria-label="上个月">
              <ChevronLeftIcon size={16} />
            </Button>
            <Button onClick={goToToday} variant="outline"
              className="rounded-none focus-visible:z-10 px-4">
              今天
            </Button>
            <Button onClick={nextMonth} variant="outline" size="icon"
              className="rounded-none rounded-r-lg focus-visible:z-10" aria-label="下个月">
              <ChevronRightIcon size={16} />
            </Button>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="lg:flex lg:flex-auto lg:flex-col">
        {/* Week header */}
        <div className="grid grid-cols-7 border border-b-0 text-center text-xs font-semibold leading-6 text-gray-500">
          {WEEK_DAYS.map((d) => (
            <div key={d} className="border-r last:border-r-0 py-2.5">{d}</div>
          ))}
        </div>

        {/* Desktop grid */}
        <div className="hidden lg:flex lg:flex-auto lg:flex-col border-x border-b">
          <div className="flex-auto grid grid-cols-7" style={{ gridAutoRows: '1fr' }}>
            {days.map((day, dayIdx) => (
              <div
                key={dayIdx}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  dayIdx === 0 && colStartClasses[getDay(day)],
                  !isSameMonth(day, firstDayCurrentMonth) && 'bg-gray-50/50 text-gray-400',
                  'relative flex flex-col border-b border-r min-h-[100px] hover:bg-gray-50 cursor-pointer transition-colors',
                )}
              >
                <header className="flex items-center justify-between p-2">
                  <button
                    type="button"
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium transition-colors',
                      isEqual(day, selectedDay) && isToday(day) && 'bg-blue-600 text-white',
                      isEqual(day, selectedDay) && !isToday(day) && 'bg-gray-900 text-white',
                      !isEqual(day, selectedDay) && isToday(day) && 'text-blue-600 font-bold',
                      !isEqual(day, selectedDay) && !isToday(day) && isSameMonth(day, firstDayCurrentMonth) && 'text-gray-900',
                      !isEqual(day, selectedDay) && !isToday(day) && !isSameMonth(day, firstDayCurrentMonth) && 'text-gray-400',
                    )}
                  >
                    <time dateTime={format(day, 'yyyy-MM-dd')}>{format(day, 'd')}</time>
                  </button>
                </header>
                <div className="flex-1 px-2 pb-2 space-y-1">
                  {data
                    .filter((d) => isSameDay(d.day, day))
                    .map((d) => (
                      <React.Fragment key={d.day.toString()}>
                        {d.events.slice(0, 2).map((event) => (
                          <button
                            key={event.id}
                            onClick={(e) => { e.stopPropagation(); onEventClick?.(event) }}
                            className={cn(
                              'w-full text-left flex flex-col gap-0.5 rounded-md px-2 py-1 text-xs leading-tight transition-opacity hover:opacity-80',
                              event.color === 'red'
                                ? 'bg-red-50 border border-red-200 text-red-700'
                                : 'bg-blue-50 border border-blue-200 text-blue-700',
                            )}
                          >
                            <p className="font-medium leading-none truncate">{event.name}</p>
                            <p className="text-[10px] opacity-70">{event.time}</p>
                          </button>
                        ))}
                        {d.events.length > 2 && (
                          <p className="text-[10px] text-gray-400 pl-1">+{d.events.length - 2} 更多</p>
                        )}
                      </React.Fragment>
                    ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile grid */}
        <div className="lg:hidden">
          <div className="grid grid-cols-7 border-x border-b">
            {days.map((day, dayIdx) => (
              <button
                key={dayIdx}
                onClick={() => setSelectedDay(day)}
                className={cn(
                  !isSameMonth(day, firstDayCurrentMonth) && 'text-gray-400',
                  isSameMonth(day, firstDayCurrentMonth) && !isEqual(day, selectedDay) && 'text-gray-900',
                  (isEqual(day, selectedDay) || isToday(day)) && 'font-semibold',
                  'flex h-14 flex-col items-center border-b border-r last:border-r-0 px-1 py-2 hover:bg-gray-50 transition-colors',
                )}
              >
                <time
                  dateTime={format(day, 'yyyy-MM-dd')}
                  className={cn(
                    'flex h-6 w-6 items-center justify-center rounded-full text-xs',
                    isEqual(day, selectedDay) && 'bg-blue-600 text-white',
                    isToday(day) && !isEqual(day, selectedDay) && 'text-blue-600 font-bold',
                  )}
                >
                  {format(day, 'd')}
                </time>
                {data.filter((d) => isSameDay(d.day, day)).length > 0 && (
                  <div className="flex gap-0.5 mt-1 flex-wrap justify-center">
                    {data.filter((d) => isSameDay(d.day, day)).flatMap((d) => d.events).slice(0, 3).map((ev) => (
                      <span key={ev.id} className={cn(
                        'h-1 w-1 rounded-full',
                        ev.color === 'red' ? 'bg-red-400' : 'bg-blue-400',
                      )} />
                    ))}
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Mobile selected day events */}
          {selectedDayEvents.length > 0 && (
            <div className="border-x border-b p-3 space-y-2">
              <p className="text-xs font-medium text-gray-500">{format(selectedDay, 'M月d日')} 的事项</p>
              {selectedDayEvents.map((event) => (
                <button
                  key={event.id}
                  onClick={() => onEventClick?.(event)}
                  className={cn(
                    'w-full text-left flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:opacity-80',
                    event.color === 'red' ? 'bg-red-50 border border-red-200' : 'bg-blue-50 border border-blue-200',
                  )}
                >
                  <div className={cn('h-2 w-2 rounded-full shrink-0', event.color === 'red' ? 'bg-red-500' : 'bg-blue-500')} />
                  <div>
                    <p className={cn('font-medium leading-none', event.color === 'red' ? 'text-red-700' : 'text-blue-700')}>{event.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{event.time}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
