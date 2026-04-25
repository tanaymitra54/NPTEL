import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { bank, getAssignmentLabelMap } from '../lib/questions'
import type { ChoiceKey, Question } from '../types'

type Payload = {
  summary: {
    id: string
    mode: 'exam' | 'practice'
    createdAt: string
    assignmentIds: number[]
    total: number
    attempted: number
    correct: number
    incorrect: number
    skipped: number
  }
  report: {
    percent: number
  }
  questions: Question[]
  answers: Record<string, ChoiceKey | undefined>
}

function readPayload(): Payload | null {
  try {
    const raw = sessionStorage.getItem('spanishQuiz.lastReport.v1')
    if (!raw) return null
    return JSON.parse(raw) as Payload
  } catch {
    return null
  }
}

export default function Report() {
  const navigate = useNavigate()
  const payload = readPayload()
  const assignmentLabels = getAssignmentLabelMap(bank.questions)

  if (!payload) {
    return (
      <div className="flex flex-col items-center justify-center py-24 min-h-[50vh] text-center space-y-6">
        <h1 className="font-serif text-2xl font-semibold text-slate-50">No report found</h1>
        <p className="text-slate-400 max-w-xs text-sm">Complete a session to generate your performance report.</p>
        <Link to="/" className="inline-flex items-center px-5 py-2.5 rounded-lg bg-orange-500 text-white text-sm font-medium hover:bg-orange-600 transition-colors">
          Return Home
        </Link>
      </div>
    )
  }

  const { summary, report, questions, answers } = payload

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-4xl mx-auto w-full space-y-8 pb-20 pt-8"
    >
      {/* Header Panel */}
      <div className="surface-card p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        
        <div>
          <h1 className="font-serif text-2xl font-semibold text-slate-50 mb-2">Performance Report</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-400">
              <span className="bg-slate-800/40 px-2.5 py-1 rounded-md border border-white/10">
               {summary.assignmentIds.map((id) => assignmentLabels.get(id) ?? `Topic ${id}`).join(', ')}
              </span>
            <span className="bg-slate-800/40 px-2.5 py-1 rounded-md border border-white/10">
              {new Date(summary.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            type="button" 
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-50 text-white hover:bg-slate-300 transition-colors"
          >
            Start New
          </button>
          <Link 
            to="/stats"
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-900/60 border border-white/10 text-slate-50 hover:bg-slate-800/40 transition-colors"
          >
            View Stats
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Score', value: `${report.percent}%`, color: 'text-orange-500', bg: 'bg-orange-500/20' },
          { label: 'Correct', value: summary.correct, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
          { label: 'Incorrect', value: summary.incorrect, color: 'text-rose-400', bg: 'bg-rose-500/10' },
          { label: 'Skipped', value: summary.skipped, color: 'text-amber-400', bg: 'bg-amber-500/10' }
        ].map((kpi, i) => (
          <motion.div 
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="surface-card p-5 flex flex-col items-center justify-center text-center"
          >
            <div className="font-serif text-2xl sm:text-3xl font-bold text-slate-50 mb-1">{kpi.value}</div>
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Detailed Review */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <h2 className="text-lg font-medium text-slate-50">Question Review</h2>
          <span className="text-xs font-medium text-slate-400">{summary.total} Questions</span>
        </div>
        
        <div className="space-y-6">
          {questions.map((q, i) => {
            const sel = answers[q.questionId]
            const correct = q.answerKey
            const ok = sel && sel === correct
            
            let statusColor = "bg-slate-800/40 text-slate-500 border-white/10"
            let statusText = "Skipped"
            
            if (ok) {
              statusColor = "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
              statusText = "Correct"
            } else if (sel) {
              statusColor = "bg-rose-500/10 text-rose-400 border-rose-500/30"
              statusText = "Incorrect"
            }

            return (
              <motion.article 
                key={q.questionId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + (i * 0.05) }}
                className="surface-card p-6 md:p-8"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-slate-500">
                      #{i + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 bg-slate-800/40 px-4 py-2 rounded-lg border border-white/10 text-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Your Answer</span>
                      <span className={`font-bold ${ok ? 'text-emerald-400' : 'text-rose-400'}`}>{sel || '-'}</span>
                    </div>
                    <div className="w-px h-6 bg-slate-900/60/10"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-slate-500">Correct Answer</span>
                      <span className="font-bold text-emerald-400">{correct}</span>
                    </div>
                  </div>
                </div>

                <div className="text-base text-slate-50 mb-6 leading-relaxed">
                  {q.prompt}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.choices.map((c) => {
                    const isCorrectChoice = c.key === correct
                    const isSelectedChoice = sel === c.key
                    
                    let optClass = "flex items-start p-3 rounded-lg border transition-colors "
                    let keyClass = "flex items-center justify-center w-5 h-5 rounded text-xs font-semibold mr-3 mt-0.5 "
                    
                    if (isCorrectChoice) {
                      optClass += "bg-emerald-500/10 border-emerald-500/30"
                      keyClass += "bg-emerald-500/30 text-white"
                    } else if (isSelectedChoice && !isCorrectChoice) {
                      optClass += "bg-rose-500/10 border-rose-500/30"
                      keyClass += "bg-rose-500/30 text-white"
                    } else {
                      optClass += "bg-slate-900/60 border-white/10 opacity-60"
                      keyClass += "bg-slate-800/40 text-slate-500"
                    }

                    return (
                      <div key={c.key} className={optClass}>
                        <div className={keyClass}>{c.key}</div>
                        <div className="text-sm text-slate-50 flex-1">{c.text}</div>
                      </div>
                    )
                  })}
                </div>

                <div className="mt-5 rounded-xl border border-white/10 bg-slate-800/40 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-orange-400">Explanation</p>
                  <p className="mt-2 text-sm text-slate-50 leading-relaxed">
                    {q.tricks || 'No explanation available for this question.'}
                  </p>
                </div>

                {q.sourceIssue && (
                  <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">Source Note</p>
                    <p className="mt-2 text-sm text-amber-300 leading-relaxed">{q.sourceIssue}</p>
                  </div>
                )}
              </motion.article>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
