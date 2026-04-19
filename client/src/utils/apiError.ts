import axios from 'axios'
import { toast } from '../store/toastStore'

export function handleApiError(error: unknown, fallbackMsg = '操作失败，请稍后重试') {
  if (axios.isAxiosError(error)) {
    if (error.message === 'Network Error') {
      toast.error('网络异常，请稍后重试')
      return
    }
    if (error.response?.status === 500) {
      toast.error('服务器错误，请联系支持')
      return
    }
    const msg = error.response?.data?.error?.message
    toast.error(msg || fallbackMsg)
    return
  }
  toast.error(fallbackMsg)
}
