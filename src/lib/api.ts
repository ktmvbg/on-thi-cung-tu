import type {
  ChatResponse,
  ExamBank,
  ExamProgress,
  GroupId,
  Health,
  QuizJob,
  QuizSettings,
  StoredExamDetail,
  SourcesResponse,
} from '../types'

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '/api').replace(/\/$/, '')

export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  })

  if (!response.ok) {
    let message = 'Có lỗi xảy ra. Vui lòng thử lại.'
    try {
      const payload = (await response.json()) as { detail?: string }
      if (payload.detail) message = payload.detail
    } catch {
      // Keep the friendly fallback when a proxy returns non-JSON.
    }
    throw new ApiError(message, response.status)
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export const api = {
  health: () => request<Health>('/health'),
  startLogin: () => request<Health>('/auth/login', { method: 'POST' }),
  sources: () => request<SourcesResponse>('/sources'),
  chat: (message: string, groupIds: GroupId[], conversationId?: string) =>
    request<ChatResponse>('/chat', {
      method: 'POST',
      body: JSON.stringify({
        message,
        group_ids: groupIds,
        conversation_id: conversationId || null,
      }),
    }),
  createQuiz: (settings: QuizSettings) =>
    request<QuizJob>('/quiz/jobs', {
      method: 'POST',
      body: JSON.stringify(settings),
    }),
  quizJob: (id: string) => request<QuizJob>(`/quiz/jobs/${id}`),
  cancelQuiz: (id: string) => request<QuizJob>(`/quiz/jobs/${id}`, { method: 'DELETE' }),
  examBank: () => request<ExamBank>('/exam-bank'),
  pregenerateExams: (count: number, settings: QuizSettings) =>
    request<ExamBank>('/exam-bank/generate', {
      method: 'POST',
      body: JSON.stringify({ ...settings, count }),
    }),
  storedExam: (id: string) => request<StoredExamDetail>(`/exam-bank/${id}`),
  saveExamProgress: (id: string, progress: ExamProgress) =>
    request<StoredExamDetail>(`/exam-bank/${id}/progress`, {
      method: 'PATCH',
      body: JSON.stringify(progress),
    }),
  deleteStoredExam: (id: string) => request<void>(`/exam-bank/${id}`, { method: 'DELETE' }),
}
