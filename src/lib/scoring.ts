import type { ChoiceKey, Question } from '../types'

export type ExamReport = {
  total: number
  attempted: number
  correct: number
  incorrect: number
  skipped: number
  percent: number
}

export function scoreExam(
  questions: Question[],
  answers: Record<string, ChoiceKey | undefined>,
): ExamReport {
  let attempted = 0
  let correct = 0
  let incorrect = 0
  let skipped = 0

  for (const q of questions) {
    const sel = answers[q.questionId]
    if (!sel) {
      skipped += 1
      continue
    }
    attempted += 1
    if (sel === q.answerKey) correct += 1
    else incorrect += 1
  }

  const total = questions.length
  const percent = total ? Math.round((correct / total) * 1000) / 10 : 0

  return { total, attempted, correct, incorrect, skipped, percent }
}
