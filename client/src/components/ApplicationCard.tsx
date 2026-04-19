import { useNavigate } from 'react-router-dom'
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
}

export default function ApplicationCard({ application, index }: Props) {
  const navigate = useNavigate()
  const isTerminal = TERMINAL_STAGES.includes(application.stage)
  const priority = PRIORITY_LABELS[application.priority] ?? PRIORITY_LABELS['2']

  return (
    <Draggable draggableId={application.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          onClick={() => navigate(`/applications/${application.id}`)}
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
          {/* 顶部：公司名 + 优先级 */}
          <div className="flex items-start justify-between gap-2 mb-1">
            <span className={`font-semibold text-sm text-gray-900 leading-tight ${isTerminal ? 'line-through' : ''}`}>
              {application.company_name}
            </span>
            <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${priority.class}`}>
              {priority.label}
            </span>
          </div>

          {/* 岗位名 */}
          <p className="text-xs text-gray-500 mb-2 leading-tight truncate">
            {application.position}
          </p>

          {/* 截止日期 */}
          <DeadlineBadge deadline={application.deadline} />

          {/* 底部标签 */}
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
      )}
    </Draggable>
  )
}
