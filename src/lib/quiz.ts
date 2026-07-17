import type { QuizQuestion } from '../types'

export function formatTime(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds)
  const hours = Math.floor(safe / 3600)
  const minutes = Math.floor((safe % 3600) / 60)
  const seconds = safe % 60
  return hours > 0
    ? `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function calculateResult(
  questions: QuizQuestion[],
  answers: Record<string, number>,
) {
  const correct = questions.reduce(
    (sum, question) => sum + (answers[question.id] === question.correct_index ? 1 : 0),
    0,
  )
  const answered = questions.filter((question) => answers[question.id] !== undefined).length
  return {
    correct,
    incorrect: answered - correct,
    unanswered: questions.length - answered,
    answered,
    percent: questions.length ? Math.round((correct / questions.length) * 100) : 0,
  }
}

