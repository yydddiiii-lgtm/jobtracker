import { useNavigate } from 'react-router-dom'
import { useState, useEffect, useRef } from 'react'
import { Draggable } from '@hello-pangea/dnd'
import type { Application } from '../types'
import DeadlineBadge from './DeadlineBadge'
import { TERMINAL_STAGES } from '../utils/stage'

const PRIORITY_LABELS: Record<string, { label: string; class: string }> = {
  '3': { label: '高', class: 'bg-red-50 text-red-600' },
  '2': { label: '中', class: 'bg-yellow-50 text-yellow-600' },
  '1': { label: '低', class: 'bg-gray-100 text-gray-500' },
}

const JOB_TYPE_LABELS: Record<string, string> = {
  daily_internship: '日常实习',
  summer_internship: '暑期实习',
  winter_internship: '寒假实习',
  fulltime: '正式岗位',
  campus: '校招',
  internship: '实习',
}

interface Props {
  application: Application
  index: number
  onDelete: (id: string) => void
}

export default function ApplicationCard({ application, index, onDelete }: Props) {
  const navigate = useNavigate()
  const isTerminal = TERMINAL_STAGES.includes(application.stage)
  const priority = PRIORITY_LABELS[application.priority] ?? PRIORITY_LABELS['2']
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!menu) return
    const close = () => setMenu(null)
    window.addEventListener('click', close)
    window.addEventListener('contextmenu', close)
    return () => { window.removeEventListener('click', close); window.removeEventListener('contextmenu', close) }
  }, [menu])

  return (
    <Draggable draggableId={application.id} index={index}>
      {(provided, snapshot) => (
        <div style={{ position: 'relative' }}>
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            onClick={() => navigate(`/applications/${application.id}`)}
            onContextMenu={(e) => {
              e.preventDefault()
              e.stopPropagation()
              setMenu({ x: e.clientX, y: e.clientY })
            }}
            className={`
              bg-white rounded-xl border p-3 cursor-pointer select-none
              transition-all duration-150
              ${snapshot.isDragging
                ? 'shadow-lg border-blue-300 rotate-1 scale-105'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
              }
              ${isTerminal ? 'opacity-50' : ''}
            `}
          >
            <div className="flex items-start justify-between gap-2 mb-1">
              <span className={`font-semibold text-sm text-gray-900 leading-tight ${isTerminal ? 'line-through' : ''}`}>
                {application.company_name}
              </span>
              <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${priority.class}`}>
                {priority.label}
              </span>
            </div>
            <p className="text-xs text-gray-500 mb-2 leading-tight truncate">
              {application.position}
            </p>
            <DeadlineBadge deadline={application.deadline} />
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-medium">
                {JOB_TYPE_LABELS[application.job_type]}
              </span>
              {application.city ? (
                <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                  {application.city}
                </span>
              ) : null}
            </div>
          </div>

          {menu && (
            <div
              ref={menuRef}
              onClick={(e) => e.stopPropagation()}
              style={{ position: 'fixed', top: menu.y, left: menu.x, zIndex: 9999 }}
              className="bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[120px]"
            >
              <button
                onClick={() => { setMenu(null); navigate(`/applications/${application.id}`) }}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                查看详情
              </button>
              <hr className="my-1 border-gray-100" />
              <button
                onClick={() => { setMenu(null); onDelete(application.id) }}
                className="w-full text-left px-3 py-1.5 text-sm text-red-500 hover:bg-red-50"
              >
                删除
              </button>
            </div>
          )}
        </div>
      )}
    </Draggable>
  )
}
