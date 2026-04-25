export type Mode = 'practice' | 'exam'

export type ChoiceKey = 'A' | 'B' | 'C' | 'D'

export type Question = {
  assignmentId: number
  assignmentLabel: string
  sectionLabel?: string
  topic?: string
  questionId: string
  sourceQuestionNumber?: number
  prompt: string
  choices: Array<{ key: ChoiceKey; text: string }>
  answerKey: ChoiceKey
  answerText?: string
  tricks?: string
  sourceIssue?: string
}

export type QuestionBank = {
  source: string
  generatedAt: string
  count: number
  questions: Question[]
}

export type Selection = {
  questionId: string
  selectedKey: ChoiceKey
}

export type AttemptSummary = {
  id: string
  mode: Mode
  createdAt: string
  assignmentIds: number[]
  total: number
  attempted: number
  correct: number
  incorrect: number
  skipped: number
}
