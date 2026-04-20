import { Droppable } from '@hello-pangea/dnd'
import type { Application, Stage } from '../types'
import ApplicationCard from './ApplicationCard'

interface Props {
  stage: Stage
  label: string
  applications: Application[]
  onDelete: (id: string) => void
}

export default function BoardColumn({ stage, label, applications, onDelete }: Props) {
  return (
    <div className="flex flex-col flex-1 min-w-[160px]">
      {/* 列头 */}
      <div className="flex items-center justify-between px-3 py-2 mb-2">
        <h3 className="font-semibold text-sm text-gray-700">{label}</h3>
        <span className="text-xs font-medium bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
          {applications.length}
        </span>
      </div>

      {/* 可拖放区域 */}
      <Droppable droppableId={stage}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`
              flex-1 min-h-[120px] rounded-xl p-2 flex flex-col gap-2 transition-colors
              ${snapshot.isDraggingOver ? 'bg-blue-50 border-2 border-blue-200 border-dashed' : 'bg-gray-50'}
            `}
          >
            {applications.length === 0 && !snapshot.isDraggingOver ? (
              <div className="flex-1 flex items-center justify-center">
                <span className="text-xs text-gray-300">暂无</span>
              </div>
            ) : null}

            {applications.map((app, index) => (
              <ApplicationCard key={app.id} application={app} index={index} onDelete={onDelete} />
            ))}

            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  )
}
