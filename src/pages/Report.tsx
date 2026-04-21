import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
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
    const raw = sessionStorage.getItem('nptelQuiz.lastReport.v1')
    if (!raw) return null
    return JSON.parse(raw) as Payload
  } catch {
    return null
  }
}

export default function Report() {
  const navigate = useNavigate()
  const payload = readPayload()

  if (!payload) {
    return (
      <div className="flex flex-col items-center justify-center py-24 min-h-[50vh] text-center space-y-6">
        <h1 className="text-2xl font-semibold text-[#2C2A29]">No report found</h1>
        <p className="text-[#787470] max-w-xs text-sm">Complete a session to generate your performance report.</p>
        <Link to="/" className="inline-flex items-center px-5 py-2.5 rounded-lg bg-[#D6A3A3] text-white text-sm font-medium hover:bg-[#C28F8F] transition-colors">
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
          <h1 className="text-2xl font-semibold text-[#2C2A29] mb-2">Performance Report</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-[#787470]">
            <span className="bg-[#FAF9F6] px-2.5 py-1 rounded-md border border-[#E8E6DF]">
              Week {summary.assignmentIds.join(', ')}
            </span>
            <span className="bg-[#FAF9F6] px-2.5 py-1 rounded-md border border-[#E8E6DF]">
              {new Date(summary.createdAt).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button 
            type="button" 
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-[#2C2A29] text-white hover:bg-[#3A3532] transition-colors"
          >
            Start New
          </button>
          <Link 
            to="/stats"
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-white border border-[#E8E6DF] text-[#2C2A29] hover:bg-[#FAF9F6] transition-colors"
          >
            View Stats
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {[
          { label: 'Score', value: `${report.percent}%`, color: 'text-[#D6A3A3]', bg: 'bg-[#F0DADA]' },
          { label: 'Correct', value: summary.correct, color: 'text-[#8AA890]', bg: 'bg-[#EBF2ED]' },
          { label: 'Incorrect', value: summary.incorrect, color: 'text-[#C5868B]', bg: 'bg-[#F9EBEB]' },
          { label: 'Skipped', value: summary.skipped, color: 'text-[#D1A866]', bg: 'bg-[#FBF4E6]' }
        ].map((kpi, i) => (
          <motion.div 
            key={kpi.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="surface-card p-5 flex flex-col items-center justify-center text-center"
          >
            <div className="text-2xl sm:text-3xl font-bold text-[#2C2A29] mb-1">{kpi.value}</div>
            <div className="text-xs font-semibold text-[#787470] uppercase tracking-widest">{kpi.label}</div>
          </motion.div>
        ))}
      </div>

      {/* Detailed Review */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-[#E8E6DF] pb-2">
          <h2 className="text-lg font-medium text-[#2C2A29]">Question Review</h2>
          <span className="text-xs font-medium text-[#787470]">{summary.total} Questions</span>
        </div>
        
        <div className="space-y-6">
          {questions.map((q, i) => {
            const sel = answers[q.questionId]
            const correct = q.answerKey
            const ok = sel && sel === correct
            
            let statusColor = "bg-[#FAF9F6] text-[#A8A4A0] border-[#E8E6DF]"
            let statusText = "Skipped"
            
            if (ok) {
              statusColor = "bg-[#EBF2ED] text-[#557B5E] border-[#A8CBAE]"
              statusText = "Correct"
            } else if (sel) {
              statusColor = "bg-[#F9EBEB] text-[#9A4248] border-[#E8B4B8]"
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
                    <span className="text-sm font-medium text-[#A8A4A0]">
                      #{i + 1}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${statusColor}`}>
                      {statusText}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-6 bg-[#FAF9F6] px-4 py-2 rounded-lg border border-[#E8E6DF] text-sm">
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-[#A8A4A0]">Your Answer</span>
                      <span className={`font-bold ${ok ? 'text-[#557B5E]' : 'text-[#9A4248]'}`}>{sel || '-'}</span>
                    </div>
                    <div className="w-px h-6 bg-[#E8E6DF]"></div>
                    <div className="flex flex-col">
                      <span className="text-[10px] uppercase font-bold text-[#A8A4A0]">Correct Answer</span>
                      <span className="font-bold text-[#557B5E]">{correct}</span>
                    </div>
                  </div>
                </div>

                <div className="text-base text-[#2C2A29] mb-6 leading-relaxed">
                  {q.prompt}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {q.choices.map((c) => {
                    const isCorrectChoice = c.key === correct
                    const isSelectedChoice = sel === c.key
                    
                    let optClass = "flex items-start p-3 rounded-lg border transition-colors "
                    let keyClass = "flex items-center justify-center w-5 h-5 rounded text-xs font-semibold mr-3 mt-0.5 "
                    
                    if (isCorrectChoice) {
                      optClass += "bg-[#EBF2ED] border-[#A8CBAE]"
                      keyClass += "bg-[#A8CBAE] text-white"
                    } else if (isSelectedChoice && !isCorrectChoice) {
                      optClass += "bg-[#F9EBEB] border-[#E8B4B8]"
                      keyClass += "bg-[#E8B4B8] text-white"
                    } else {
                      optClass += "bg-white border-[#E8E6DF] opacity-60"
                      keyClass += "bg-[#FAF9F6] text-[#A8A4A0]"
                    }

                    return (
                      <div key={c.key} className={optClass}>
                        <div className={keyClass}>{c.key}</div>
                        <div className="text-sm text-[#2C2A29] flex-1">{c.text}</div>
                      </div>
                    )
                  })}
                </div>
              </motion.article>
            )
          })}
        </div>
      </div>
    </motion.div>
  )
}
