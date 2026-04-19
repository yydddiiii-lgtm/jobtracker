import type { Stage } from '../types'

export const STAGE_LABELS: Record<Stage, string> = {
  pending:       '待投递',
  applied:       '已投递',
  written_test:  '笔试',
  interview_1:   '一面',
  interview_2:   '二/三面',
  hr_interview:  'HR面',
  offer:         'Offer',
  rejected:      '已拒绝',
  withdrawn:     '已放弃',
}

export const STAGE_ORDER: Stage[] = [
  'pending', 'applied', 'written_test',
  'interview_1', 'interview_2', 'hr_interview',
  'offer', 'rejected', 'withdrawn',
]

export const TERMINAL_STAGES: Stage[] = ['rejected', 'withdrawn']
