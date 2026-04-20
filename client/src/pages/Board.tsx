import { useEffect, useState } from 'react'
import { DragDropContext, type DropResult } from '@hello-pangea/dnd'
import { useAppStore } from '../store/appStore'
import { applicationsApi } from '../api/applications'
import { handleApiError } from '../utils/apiError'
import { STAGE_ORDER, STAGE_LABELS } from '../utils/stage'
import BoardColumn from '../components/BoardColumn'
import AddApplicationModal from '../components/AddApplicationModal'
import Spinner from '../components/Spinner'
import type { Stage } from '../types'

export default function Board() {
  const { applications, isLoading, fetchApplications, updateApplication, removeApplication } = useAppStore()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  // 按 stage 分组
  const grouped = STAGE_ORDER.reduce((acc, stage) => {
    acc[stage] = applications.filter((a) => a.stage === stage)
    return acc
  }, {} as Record<Stage, typeof applications>)

  const isEmpty = applications.length === 0

  const handleDelete = async (id: string) => {
    removeApplication(id)
    try {
      await applicationsApi.remove(id)
    } catch (err) {
      fetchApplications()
      handleApiError(err, '删除失败')
    }
  }

  const handleDragEnd = async (result: DropResult) => {
    const { draggableId, destination, source } = result
    if (!destination) return
    if (destination.droppableId === source.droppableId && destination.index === source.index) return

    const newStage = destination.droppableId as Stage
    const oldStage = source.droppableId as Stage

    // 乐观更新
    updateApplication(draggableId, { stage: newStage })

    try {
      await applicationsApi.update(draggableId, { stage: newStage })
    } catch (err) {
      // 回滚
      updateApplication(draggableId, { stage: oldStage })
      handleApiError(err, '阶段更新失败，已回到原位')
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* 顶部工具栏 */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white">
        <div className="flex items-center gap-3">
          <h2 className="font-semibold text-gray-900">申请看板</h2>
          {!isLoading ? (
            <span className="text-sm text-gray-400">{applications.length} 条申请</span>
          ) : null}
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          新建申请
        </button>
      </div>

      {/* 看板内容 */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Spinner className="w-8 h-8" />
        </div>
      ) : isEmpty ? (
        <EmptyState onAdd={() => setShowModal(true)} />
      ) : (
        <div className="flex-1 overflow-x-auto">
          <DragDropContext onDragEnd={handleDragEnd}>
            <div className="flex gap-3 px-6 py-4 h-full w-full">
              {STAGE_ORDER.map((stage) => (
                <BoardColumn
                  key={stage}
                  stage={stage}
                  label={STAGE_LABELS[stage]}
                  applications={grouped[stage] ?? []}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          </DragDropContext>
        </div>
      )}

      {/* 新建弹窗 */}
      {showModal ? (
        <AddApplicationModal onClose={() => setShowModal(false)} />
      ) : null}
    </div>
  )
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center gap-4 text-center px-4">
      {/* 插画占位 */}
      <div className="w-40 h-40 rounded-2xl bg-blue-50 flex items-center justify-center">
        <svg className="w-20 h-20 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      </div>
      <div>
        <h3 className="font-semibold text-gray-800 text-lg">还没有申请记录</h3>
        <p className="text-gray-400 text-sm mt-1">开始追踪你的第一条求职申请吧</p>
      </div>
      <button
        onClick={onAdd}
        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors"
      >
        新建第一条申请
      </button>
    </div>
  )
}
