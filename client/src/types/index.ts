export type Stage =
  | 'pending' | 'applied' | 'written_test'
  | 'interview_1' | 'interview_2' | 'hr_interview'
  | 'offer' | 'rejected' | 'withdrawn'

export type JobType = 'campus' | 'internship' | 'daily_internship' | 'summer_internship' | 'winter_internship' | 'fulltime'
export type Priority = '1' | '2' | '3'
export type InterviewType = 'online' | 'onsite' | 'phone'
export type InterviewResult = 'pending' | 'passed' | 'failed' | 'cancelled'
export type HeadcountType = 'regular' | 'outsourced' | 'contract'
export type NotificationType =
  | 'deadline_3d' | 'deadline_1d' | 'deadline_today'
  | 'interview_24h' | 'interview_2h'
  | 'stage_changed' | 'offer_deadline'

export interface User {
  id: string
  email: string
  name: string
  avatar_url: string | null
}

export interface Application {
  id: string
  user_id: string
  company_name: string
  position: string
  job_type: JobType
  stage: Stage
  city: string | null
  salary_min: number | null
  salary_max: number | null
  deadline: string | null
  job_url: string | null
  notes: string | null
  priority: Priority
  referral_code: string | null
  created_at: string
  updated_at: string
}

export interface StageLog {
  id: string
  application_id: string
  from_stage: Stage | null
  to_stage: Stage
  note: string | null
  changed_at: string
}

export interface Interview {
  id: string
  application_id: string
  round: string
  interview_time: string
  interview_type: InterviewType
  location: string | null
  interviewer: string | null
  prep_notes: string | null
  result: InterviewResult
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  application_id: string
  doc_type: string
  is_submitted: boolean
  submitted_at: string | null
  notes: string | null
  created_at: string
}

export interface Offer {
  id: string
  application_id: string
  base_salary: number | null
  city: string | null
  department: string | null
  headcount_type: HeadcountType | null
  offer_deadline: string | null
  is_accepted: boolean | null
  notes: string | null
  created_at: string
  updated_at: string
  company_name?: string
  position?: string
}

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  content: string
  related_id: string | null
  is_read: boolean
  created_at: string
}

export interface StatsOverview {
  stageCounts: Partial<Record<Stage, number>>
  offerRate: number
  weeklyTrend: Array<{ week: string; count: number }>
  byJobType: { campus?: number; internship?: number }
}

export interface ApiResponse<T> {
  success: boolean
  data: T
}
