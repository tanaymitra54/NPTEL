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
        <h1 className="text-xl font-medium text-[#2C2A29] mb-4">No questions found</h1>
        <Link to="/" className="text-[#D6A3A3] hover:underline">Return Home</Link>
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
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2C2A29] flex items-center gap-3">
              <BookIcon className="w-8 h-8" />
              Learn Mode
              <span className="text-base px-3 py-1.5 rounded-lg font-semibold bg-[#F0DADA] text-[#9B7A7A]">
                {idx + 1}/{questions.length}
              </span>
            </h1>
            <p className="text-base text-[#787470] mt-2">Study all questions with detailed explanations</p>
          </div>

          <motion.div
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
          >
            <Link
              to="/"
              className="flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300 gradient-dark text-white shadow-md hover:shadow-lg"
            >
              ← Back to Home
            </Link>
          </motion.div>
        </div>

        {/* Progress Bar */}
        <div className="w-full space-y-2">
          <motion.div 
            className="w-full bg-[#E8E6DF] h-2 rounded-full overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <motion.div 
              className="bg-gradient-to-r from-[#D6A3A3] to-[#9B7A7A] h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((idx + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </motion.div>
          <p className="text-xs text-[#787470] font-medium">{Math.round(((idx + 1) / questions.length) * 100)}% Through Course</p>
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
                <span className="text-xs font-semibold text-[#9B7A7A] tracking-wide uppercase">Question</span>
              </div>
              
              <h2 className="text-3xl sm:text-4xl font-bold text-[#2C2A29] leading-snug">
                {q.prompt}
              </h2>
            </section>

            {/* Answer Section */}
            <section className="space-y-4">
              <h3 className="text-lg font-semibold text-[#2C2A29] flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#A8CBAE] text-white text-sm font-bold">
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
                          ? 'bg-[#F2F8F5] border-[#A8CBAE] text-[#2C2A29] shadow-sm'
                          : 'bg-white border-[#E8E6DF] text-[#787470]'
                      }`}
                    >
                      <div
                        className={`flex items-center justify-center min-w-10 h-10 rounded-lg text-base font-bold mr-4 mt-0.5 ${
                          isCorrect
                            ? 'bg-[#A8CBAE] text-white'
                            : 'bg-[#FAF9F6] text-[#A8A4A0]'
                        }`}
                      >
                        {c.key}
                      </div>
                      <div className="flex-1">
                        <p className="text-lg font-medium">{c.text}</p>
                        {isCorrect && (
                          <p className="text-xs font-semibold mt-3 text-[#3F6347] inline-flex items-center gap-1">
                            ✓ This is the correct answer
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </section>

            {/* Memory Toolkit */}
            <section className="border-t border-[#E8E6DF] pt-10 space-y-6">
              <h3 className="text-lg font-semibold text-[#2C2A29] flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#D6A3A3] text-white text-sm font-bold">
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
                    className="rounded-xl border border-[#E8E6DF] bg-white p-6 hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[#F0DADA] flex items-center justify-center text-sm font-bold text-[#9B7A7A] flex-shrink-0 mt-0.5">
                        {tipIdx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#9B7A7A] tracking-wide uppercase">{tip.title}</p>
                        <p className="mt-2 text-base text-[#2C2A29] leading-relaxed">{tip.body}</p>
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
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-base font-semibold transition-all
            ${idx === 0 
              ? 'text-[#A8A4A0] cursor-not-allowed bg-[#FAF9F6]' 
              : 'text-white gradient-dark shadow-md hover:shadow-lg hover:-translate-y-1'
            }`}
        >
          <LeftArrowIcon className="w-5 h-5" />
          Previous
        </motion.button>

        <div className="text-center space-y-1">
          <p className="text-sm font-semibold text-[#2C2A29]">{idx + 1} / {questions.length}</p>
          <p className="text-xs text-[#787470]">Use arrow keys to navigate</p>
        </div>

        <motion.button
          whileHover={idx !== questions.length - 1 ? { x: 4 } : {}}
          onClick={() => go(1)}
          disabled={idx === questions.length - 1}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-base font-semibold transition-all
            ${idx === questions.length - 1 
              ? 'text-[#A8A4A0] cursor-not-allowed bg-[#FAF9F6]' 
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
