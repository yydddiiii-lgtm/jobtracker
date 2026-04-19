import { useToastStore } from '../store/toastStore'
import type { ToastType } from '../store/toastStore'

const iconMap: Record<ToastType, string> = {
  success: '✓',
  error:   '✕',
  warning: '⚠',
  info:    'ℹ',
}

const colorMap: Record<ToastType, string> = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error:   'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-orange-50 border-orange-200 text-orange-800',
  info:    'bg-blue-50 border-blue-200 text-blue-800',
}

export default function ToastContainer() {
  const { toasts, removeToast } = useToastStore()

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-md text-sm font-medium min-w-[280px] ${colorMap[t.type]}`}
        >
          <span className="font-bold">{iconMap[t.type]}</span>
          <span className="flex-1">{t.message}</span>
          <button onClick={() => removeToast(t.id)} className="opacity-60 hover:opacity-100 transition-opacity">✕</button>
        </div>
      ))}
    </div>
  )
}
