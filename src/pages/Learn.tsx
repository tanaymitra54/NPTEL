import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { bank, pickQuestions } from '../lib/questions'
import { parseWeeksFromQuery, getAssignmentIds } from '../lib/selection'
import { BookIcon, LightbulbIcon, CheckIcon, LeftArrowIcon, RightArrowIcon } from '../components/Icons'
import type { Question } from '../types'

const LEARN_MODE_COUNT = 'all'
const LEARN_MODE_SHUFFLE = false

type LearnTip = {
  title: string
  body: string
}

function normalizeTricks(raw?: string): LearnTip[] {
  if (!raw) return []
  const lines = raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)

  if (!lines.length) return []

  const tips = lines.map((line, i) => {
    const markerMatch = line.match(/^[-*\d.)\s]+(.*)$/)
    const clean = (markerMatch ? markerMatch[1] : line).trim()
    const split = clean.match(/^([^:]{3,28}):\s*(.+)$/)

    if (split) {
      return {
        title: split[1].trim(),
        body: split[2].trim(),
      }
    }

    return {
      title: `Tip ${i + 1}`,
      body: clean,
    }
  })

  return tips.slice(0, 4)
}

function buildAutoTips(q: Question): LearnTip[] {
  const correct = q.choices.find((c) => c.key === q.answerKey)
  const body = correct?.text ?? ''
  const compact = body.replace(/\s+/g, ' ').trim()
  const keyword = compact
    .split(/[.,;()]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .sort((a, b) => b.length - a.length)[0]

  return [
    {
      title: 'Anchor',
      body: `Lock on option ${q.answerKey}${keyword ? ` by remembering: ${keyword}.` : '.'}`,
    },
    {
      title: 'Eliminate',
      body: 'First reject options with absolute words or weak relevance, then compare the last two choices.',
    },
    {
      title: 'Recall Check',
      body: 'Before moving on, say the answer key once and explain why it is correct in one line.',
    },
  ]
}

function getLearnTips(q: Question): LearnTip[] {
  const parsed = normalizeTricks(q.tricks)
  if (parsed.length) return parsed
  return buildAutoTips(q)
}

export default function Learn() {
  const [sp] = useSearchParams()

  const [learnConfig] = useState(() => {
    const grouping = sp.get('grouping') === 'mixed' ? 'mixed' : 'week'
    const weeks = parseWeeksFromQuery(sp.get('weeks'))
    const assignmentIds = getAssignmentIds(weeks, grouping)
    const questions = pickQuestions(bank.questions, assignmentIds, LEARN_MODE_COUNT, LEARN_MODE_SHUFFLE)
    return { assignmentIds, questions }
  })

  const { questions } = learnConfig

  const [idx, setIdx] = useState(0)
  const [direction, setDirection] = useState(1)

  // Arrow key navigation
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        go(-1)
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        go(1)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const q = questions[idx]
  const learnTips = q ? getLearnTips(q) : []

  function go(delta: number) {
    setDirection(delta)
    setIdx((prev) => {
      const next = prev + delta
      if (next < 0) return 0
      if (next >= questions.length) return questions.length - 1
      return next
    })
  }

  if (!questions.length || !q) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-xl font-medium text-slate-50 mb-4">No questions found</h1>
        <Link to="/" className="text-orange-500 hover:underline">Return Home</Link>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="max-w-5xl mx-auto w-full flex flex-col min-h-[75vh] pb-12"
    >
       {/* Header with Navigation */}
       <div className="mb-8">
         <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
           <div>
             <h1 className="font-serif text-2xl sm:text-3xl font-bold text-slate-50 flex items-center gap-3">
               <BookIcon className="w-7 h-7" />
               Learn Mode
               <span className="text-sm px-3 py-1.5 rounded-lg font-semibold bg-orange-500/20 text-orange-400">
                 {idx + 1}/{questions.length}
               </span>
             </h1>
             <p className="text-sm text-slate-400 mt-2">Study all questions with detailed explanations</p>
           </div>

           <motion.div
             whileHover={{ y: -2 }}
             whileTap={{ y: 0 }}
           >
             <Link
               to="/"
               className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 gradient-dark text-white shadow-md hover:shadow-lg"
             >
               ← Back to Home
             </Link>
           </motion.div>
         </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <motion.div 
            className="w-full bg-slate-900/60/10 h-2 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="bg-gradient-to-r from-orange-500 to-orange-400 h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((idx + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </motion.div>
          <p className="text-xs text-slate-400 font-medium">{Math.round(((idx + 1) / questions.length) * 100)}% Through Course</p>
        </div>
      </div>

      {/* Study Card Container */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="surface-elevated flex-1 relative overflow-hidden flex flex-col"
      >
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={idx}
            custom={direction}
            initial={{ opacity: 0, x: direction > 0 ? 20 : -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction > 0 ? -20 : 20 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="p-8 sm:p-12 flex-1 flex flex-col space-y-10 overflow-y-auto custom-scrollbar"
          >
            {/* Question Section */}
            <section className="space-y-6">
              <div className="flex items-baseline gap-3">
                <div className="w-10 h-10 rounded-lg gradient-accent flex items-center justify-center text-white font-bold text-lg">
                  {idx + 1}
                </div>
                <span className="text-xs font-semibold text-orange-400 tracking-wide uppercase">Question</span>
              </div>
              
              <h2 className="font-comic text-xl sm:text-2xl font-bold text-slate-50 leading-snug">
                {q.prompt}
              </h2>
            </section>

            {/* Answer Section */}
            <section className="space-y-4">
              <h3 className="text-base font-semibold text-slate-50 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500/30 text-white text-sm font-bold">
                  <CheckIcon className="w-4 h-4" />
                </span>
                Correct Answer
              </h3>
              
              <div className="space-y-2">
                {q.choices.map((c) => {
                  const isCorrect = c.key === q.answerKey
                  return (
                    <motion.div
                      key={c.key}
                      initial={isCorrect ? { opacity: 0, x: -10 } : { opacity: 0 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`w-full flex items-start p-6 rounded-xl border-2 text-left transition-all ${
                        isCorrect
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-slate-50 shadow-sm'
                          : 'bg-slate-900/60 border-white/10 text-slate-400'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center min-w-10 h-10 rounded-lg text-base font-bold mr-4 mt-0.5 ${
                          isCorrect
                            ? 'bg-emerald-500/30 text-white'
                            : 'bg-slate-800/40 text-slate-500'
                        }`}
                      >
                        {c.key}
                      </div>
                      <div className="flex-1">
                        <p className="text-base font-medium">{c.text}</p>
                        {isCorrect && (
                          <p className="text-xs font-semibold mt-3 text-emerald-400 inline-flex items-center gap-1">
                            ✓ This is the correct answer
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </section>

            <section className="border-t border-white/10 pt-10 space-y-4">
              <h3 className="text-base font-semibold text-slate-50">Explanation</h3>
              <div className="rounded-xl border border-white/10 bg-slate-800/40 p-6">
                <p className="text-sm text-slate-50 leading-relaxed">
                  {q.tricks || 'No explanation available for this question.'}
                </p>
              </div>
              {q.sourceIssue && (
                <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-amber-500">Source Note</p>
                  <p className="mt-2 text-sm text-amber-300 leading-relaxed">{q.sourceIssue}</p>
                </div>
              )}
            </section>

            {/* Memory Toolkit */}
            <section className="border-t border-white/10 pt-10 space-y-6">
              <h3 className="text-base font-semibold text-slate-50 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-orange-500 text-white text-sm font-bold">
                  <LightbulbIcon className="w-4 h-4" />
                </span>
                Memory Toolkit
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {learnTips.map((tip, tipIdx) => (
                  <motion.div 
                    key={`${tip.title}-${tipIdx}`}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: tipIdx * 0.1 }}
                    className="rounded-xl border border-white/10 bg-slate-900/60 p-6 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center text-sm font-bold text-orange-400 flex-shrink-0 mt-0.5">
                        {tipIdx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-semibold text-orange-400 tracking-wide uppercase">{tip.title}</p>
                        <p className="mt-2 text-sm text-slate-50 leading-relaxed">{tip.body}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Bottom Navigation */}
       <div className="mt-8 flex items-center justify-between gap-4">
         <motion.button
           whileHover={idx !== 0 ? { x: -4 } : {}}
           onClick={() => go(-1)}
           disabled={idx === 0}
           className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all
             ${idx === 0 
               ? 'text-slate-500 cursor-not-allowed bg-slate-800/40' 
               : 'text-white gradient-dark shadow-md hover:shadow-lg hover:-translate-y-1'
             }`}
         >
           <LeftArrowIcon className="w-5 h-5" />
           Previous
         </motion.button>

         <div className="text-center space-y-1">
           <p className="text-xs font-semibold text-slate-50">{idx + 1} / {questions.length}</p>
           <p className="text-xs text-slate-400">Use arrow keys to navigate</p>
         </div>

         <motion.button
           whileHover={idx !== questions.length - 1 ? { x: 4 } : {}}
           onClick={() => go(1)}
           disabled={idx === questions.length - 1}
           className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all
             ${idx === questions.length - 1 
               ? 'text-slate-500 cursor-not-allowed bg-slate-800/40' 
               : 'text-white gradient-accent shadow-md hover:shadow-lg hover:-translate-y-1'
             }`}
         >
          Next
          <RightArrowIcon className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  )
}
