export type AppMode = 'live' | 'demo'
export type GroupId = 'main' | 'supplement_1' | 'supplement_2' | 'exam'
export type Difficulty = 'easy' | 'medium' | 'hard'

export interface AuthStatus {
  state: 'ready' | 'missing' | 'invalid' | 'logging_in' | 'demo'
  message: string
  cookie_file: string
  missing_cookies: string[]
}

export interface Health {
  status: 'ok'
  mode: AppMode
  requested_mode: string
  notebook_id: string
  auth: AuthStatus
  version: string
}

export interface SourceItem {
  id: string
  title: string
  kind?: string
  ready: boolean
}

export interface SourceGroup {
  id: GroupId
  label: string
  description: string
  accent: string
  sources: SourceItem[]
}

export interface SourcesResponse {
  groups: SourceGroup[]
  unmatched: SourceItem[]
  mode: AppMode
}

export interface Citation {
  number: number
  source_id: string
  source_title: string
  excerpt?: string
}

export interface ChatResponse {
  answer: string
  conversation_id?: string
  citations: Citation[]
  mode: AppMode
}

export interface QuizOption {
  id: string
  text: string
}

export interface QuizQuestion {
  id: string
  prompt: string
  options: QuizOption[]
  correct_index: number
  explanation: string
  source_hint?: string
}

export type QuizJobStatus = 'queued' | 'running' | 'ready' | 'error' | 'cancelled'

export interface QuizJob {
  id: string
  status: QuizJobStatus
  progress: number
  message: string
  question_count: number
  difficulty: Difficulty
  duration_minutes: number
  created_at: string
  questions?: QuizQuestion[]
  mode: AppMode
}

export interface QuizSettings {
  question_count: number
  difficulty: Difficulty
  duration_minutes: number
  group_ids: GroupId[]
}

export type StoredExamStatus = 'queued' | 'generating' | 'ready' | 'in_progress' | 'completed' | 'error'

export interface StoredExamSummary {
  id: string
  status: StoredExamStatus
  progress: number
  message: string
  question_count: number
  difficulty: Difficulty
  duration_minutes: number
  created_at: string
  generated_at?: string
  started_at?: string
  updated_at: string
  finished_at?: string
  remaining_seconds: number
  current_index: number
  answered_count: number
  conversation_id?: string
}

export interface StoredExamDetail extends StoredExamSummary {
  questions?: QuizQuestion[]
  answers: Record<string, number>
  flags: string[]
}

export interface ExamProgress {
  remaining_seconds: number
  current_index: number
  answers: Record<string, number>
  flags: string[]
  completed?: boolean
}

export interface ExamBank {
  max_sets: number
  used_slots: number
  available_slots: number
  exams: StoredExamSummary[]
}
