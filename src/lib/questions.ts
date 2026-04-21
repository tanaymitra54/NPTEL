import raw from '../data/questions.json'
import type { Question, QuestionBank } from '../types'

export const bank = raw as unknown as QuestionBank

export function getAssignments(questions: Question[]) {
  const map = new Map<number, { id: number; label: string; count: number }>()
  for (const q of questions) {
    const existing = map.get(q.assignmentId)
    if (existing) {
      existing.count += 1
    } else {
      map.set(q.assignmentId, {
        id: q.assignmentId,
        label: q.assignmentLabel,
        count: 1,
      })
    }
  }
  return [...map.values()].sort((a, b) => b.id - a.id)
}

export function pickQuestions(
  questions: Question[],
  assignmentIds: number[],
  count: number | 'all',
  shuffle: boolean,
) {
  let pool = questions
  if (assignmentIds.length) {
    const set = new Set(assignmentIds)
    pool = pool.filter((q) => set.has(q.assignmentId))
  }
  let selected = pool.slice()
  if (shuffle) selected = shuffleInPlace(selected)
  if (count !== 'all') selected = selected.slice(0, Math.max(1, count))
  return selected
}

export function shuffleInPlace<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}
