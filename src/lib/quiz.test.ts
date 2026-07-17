import { describe, expect, it } from 'vitest'
import { calculateResult, formatTime } from './quiz'
import type { QuizQuestion } from '../types'

const questions: QuizQuestion[] = [
  {
    id: 'q1',
    prompt: 'Q1',
    options: ['A', 'B', 'C', 'D'].map((text, index) => ({ id: String(index), text })),
    correct_index: 1,
    explanation: 'B',
  },
  {
    id: 'q2',
    prompt: 'Q2',
    options: ['A', 'B', 'C', 'D'].map((text, index) => ({ id: String(index), text })),
    correct_index: 0,
    explanation: 'A',
  },
]

describe('quiz utilities', () => {
  it('formats countdown values', () => {
    expect(formatTime(5400)).toBe('01:30:00')
    expect(formatTime(65)).toBe('01:05')
  })

  it('calculates result buckets', () => {
    expect(calculateResult(questions, { q1: 1 })).toEqual({
      correct: 1,
      incorrect: 0,
      unanswered: 1,
      answered: 1,
      percent: 50,
    })
  })
})

