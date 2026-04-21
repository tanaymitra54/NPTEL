import type { AttemptSummary, ChoiceKey, Mode } from '../types'

const KEY = {
  attempts: 'nptelQuiz.attempts.v1',
  practiceStats: 'nptelQuiz.practiceStats.v1',
} as const

type PracticeStats = Record<
  string,
  {
    seen: number
    correct: number
    incorrect: number
    lastSeenAt: string
  }
>

function readJson<T>(k: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(k)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(k: string, v: unknown) {
  localStorage.setItem(k, JSON.stringify(v))
}

export function recordAttempt(summary: AttemptSummary) {
  const attempts = readJson<AttemptSummary[]>(KEY.attempts, [])
  attempts.unshift(summary)
  writeJson(KEY.attempts, attempts.slice(0, 50))
}

export function getAttempts() {
  return readJson<AttemptSummary[]>(KEY.attempts, [])
}

export function clearAttempts() {
  localStorage.removeItem(KEY.attempts)
}

export function updatePracticeStat(
  questionId: string,
  result: 'correct' | 'incorrect',
) {
  const now = new Date().toISOString()
  const stats = readJson<PracticeStats>(KEY.practiceStats, {})
  const existing =
    stats[questionId] ?? ({ seen: 0, correct: 0, incorrect: 0, lastSeenAt: now } as const)
  const next = {
    ...existing,
    seen: existing.seen + 1,
    correct: existing.correct + (result === 'correct' ? 1 : 0),
    incorrect: existing.incorrect + (result === 'incorrect' ? 1 : 0),
    lastSeenAt: now,
  }
  stats[questionId] = next
  writeJson(KEY.practiceStats, stats)
}

export function getPracticeStats() {
  return readJson<PracticeStats>(KEY.practiceStats, {})
}

export function makeAttemptId(mode: Mode) {
  return `${mode}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`
}

export function isChoiceKey(x: string): x is ChoiceKey {
  return x === 'A' || x === 'B' || x === 'C' || x === 'D'
}
