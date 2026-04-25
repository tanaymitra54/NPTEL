import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { bank, getAssignmentLabelMap, pickQuestions } from '../lib/questions'
import { parseWeeksFromQuery, parseCountFromQuery, getAssignmentIds } from '../lib/selection'
import { scoreExam } from '../lib/scoring'
import { makeAttemptId, recordAttempt, updatePracticeStat } from '../lib/storage'
import { ClipboardIcon, PencilIcon, SendIcon, CheckIcon, LeftArrowIcon, RightArrowIcon } from '../components/Icons'
import type { ChoiceKey, Mode, Question } from '../types'

function toChoiceKey(k: string): ChoiceKey {
  if (k === 'A' || k === 'B' || k === 'C' || k === 'D') return k
  return 'A'
}

function makeAnswerMap() {
  return Object.create(null) as Record<string, ChoiceKey | undefined>
}

export default function Run() {
  const [sp] = useSearchParams()
  const navigate = useNavigate()
  const assignmentLabels = useMemo(() => getAssignmentLabelMap(bank.questions), [])

  const [runConfig] = useState(() => {
    const mode = (sp.get('mode') === 'exam' ? 'exam' : 'practice') as Mode
    const shuffle = sp.get('shuffle') !== '0'
    const grouping = sp.get('grouping') === 'mixed' ? 'mixed' : 'week'
    const weeks = parseWeeksFromQuery(sp.get('weeks'))
    const count = parseCountFromQuery(sp.get('count'))
    const assignmentIds = getAssignmentIds(weeks, grouping)
    const questions = pickQuestions(bank.questions, assignmentIds, count, shuffle)
    return { mode, assignmentIds, questions }
  })

  const { mode, assignmentIds, questions } = runConfig
  const topicNames = assignmentIds.map((id) => assignmentLabels.get(id) ?? `Topic ${id}`)

  const [idx, setIdx] = useState(0)
  const [direction, setDirection] = useState(1) // For animation
  const [answers, setAnswers] = useState<Record<string, ChoiceKey | undefined>>(makeAnswerMap)
  const [practiceLock, setPracticeLock] = useState<Record<string, boolean>>(() => Object.create(null))

  useEffect(() => {
    setIdx(0)
    setAnswers(makeAnswerMap())
    setPracticeLock(Object.create(null))
  }, [mode, questions])

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
  const selectedKey = q ? answers[q.questionId] : undefined
  const isLocked = q ? Boolean(practiceLock[q.questionId]) : false
  const isCorrect = q && selectedKey ? selectedKey === q.answerKey : false

  const attemptedCount = useMemo(() => {
    let n = 0
    for (const qq of questions) if (answers[qq.questionId]) n++
    return n
  }, [answers, questions])

  const progress = questions.length > 0 ? (attemptedCount / questions.length) * 100 : 0

  function selectAnswer(qq: Question, key: ChoiceKey) {
    if (mode === 'practice') {
      if (practiceLock[qq.questionId]) return
      setAnswers((prev) => ({ ...prev, [qq.questionId]: key }))
      setPracticeLock((prev) => ({ ...prev, [qq.questionId]: true }))
      try { updatePracticeStat(qq.questionId, key === qq.answerKey ? 'correct' : 'incorrect') } catch (e) {}
      return
    }
    setAnswers((prev) => ({ ...prev, [qq.questionId]: key }))
  }

  function go(delta: number) {
    setDirection(delta)
    setIdx((prev) => {
      const next = prev + delta
      if (next < 0) return 0
      if (next >= questions.length) return questions.length - 1
      return next
    })
  }

  function submit() {
    const report = scoreExam(questions, answers)
    const summary = {
      id: makeAttemptId(mode),
      mode,
      createdAt: new Date().toISOString(),
      assignmentIds,
      total: report.total,
      attempted: report.attempted,
      correct: report.correct,
      incorrect: report.incorrect,
      skipped: report.skipped,
    }
    recordAttempt(summary)
    
    if (mode === 'exam') {
      const payload = { summary, report, questions, answers }
        sessionStorage.setItem('spanishQuiz.lastReport.v1', JSON.stringify(payload))
        navigate('/report')
    } else {
      navigate('/stats')
    }
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
      className="w-full flex flex-col min-h-[75vh] pb-12"
    >
      {/* Header with Context */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-3xl sm:text-4xl font-bold text-[#2C2A29] capitalize flex items-center gap-3">
              {mode === 'exam' ? (
                <>
                  <ClipboardIcon className="w-8 h-8" />
                  Exam
                </>
              ) : (
                <>
                  <PencilIcon className="w-8 h-8" />
                  Practice
                </>
              )} Session
              <span className="text-base px-3 py-1.5 rounded-lg font-semibold bg-[#F0DADA] text-[#9B7A7A]">
                {attemptedCount}/{questions.length}
              </span>
            </h1>
            <p className="text-base text-[#787470] mt-2">Topics: {topicNames.join(', ')}</p>
          </div>
          
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            onClick={submit}
            disabled={mode === 'exam' && attemptedCount === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-base font-semibold transition-all duration-300 whitespace-nowrap ${
              mode === 'exam' && attemptedCount === 0 
                ? 'bg-[#FAF9F6] text-[#A8A4A0] border border-[#E8E6DF] cursor-not-allowed' 
                : 'gradient-accent text-white border-none shadow-md hover:shadow-lg'
            }`}
          >
            {mode === 'exam' ? (
              <>
                <SendIcon className="w-5 h-5" />
                Submit
              </>
            ) : (
              <>
                <CheckIcon className="w-5 h-5" />
                Finish
              </>
            )}
          </motion.button>
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
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </motion.div>
          <p className="text-xs text-[#787470] font-medium">{Math.round(progress)}% Complete</p>
        </div>
      </div>

      <div className="flex-1 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Main Question Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="surface-elevated p-8 sm:p-12 relative overflow-hidden flex flex-col min-h-[450px]"
        >
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={idx}
              custom={direction}
              initial={{ opacity: 0, x: direction > 0 ? 15 : -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction > 0 ? -15 : 15 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex-1 flex flex-col"
            >
            {/* Question Marker */}
            <div className="inline-flex items-center gap-2 mb-6 w-fit">
              <div className="w-8 h-8 rounded-lg gradient-accent flex items-center justify-center text-white text-sm font-bold">
                {idx + 1}
              </div>
              <span className="text-xs font-semibold text-[#9B7A7A] tracking-wide uppercase">Question</span>
            </div>

            {/* Question Prompt */}
            <h2 className="text-3xl sm:text-4xl font-bold text-[#2C2A29] leading-snug mb-10">
              {q.prompt}
            </h2>

            {/* Answer Options */}
            <div className="space-y-3 flex-1">
              {q.choices.map((c) => {
                const sel = selectedKey === c.key
                const correct = c.key === q.answerKey
                const showFeedback = mode === 'practice' && isLocked
                
                let btnClass = "w-full flex items-start p-6 rounded-xl border-2 text-left transition-all duration-300 "
                let keyClass = "flex items-center justify-center min-w-10 h-10 rounded-lg text-base font-bold mr-4 mt-0.5 "
                
                if (showFeedback) {
                  if (correct) {
                    btnClass += "bg-[#F2F8F5] border-[#A8CBAE] text-[#2C2A29] shadow-sm"
                    keyClass += "bg-[#A8CBAE] text-white"
                  } else if (sel && !correct) {
                    btnClass += "bg-[#FCF5F5] border-[#E8B4B8] text-[#2C2A29] shadow-sm"
                    keyClass += "bg-[#E8B4B8] text-white"
                  } else {
                    btnClass += "bg-white border-[#E8E6DF] opacity-50 text-[#787470]"
                    keyClass += "bg-[#FAF9F6] text-[#A8A4A0]"
                  }
                } else {
                  if (sel) {
                    btnClass += "bg-[#F0DADA]/40 border-[#D6A3A3] text-[#2C2A29] shadow-sm"
                    keyClass += "bg-[#D6A3A3] text-white"
                  } else {
                    btnClass += "bg-white border-[#E8E6DF] hover:border-[#D6A3A3]/50 hover:bg-[#FAF9F6] text-[#2C2A29] cursor-pointer"
                    keyClass += "bg-[#FAF9F6] text-[#787470] border border-[#E8E6DF] group-hover:bg-[#D6A3A3] group-hover:text-white"
                  }
                }

                return (
                  <motion.button
                    key={c.key}
                    type="button"
                    whileHover={!isLocked ? { x: 4 } : {}}
                    whileTap={!isLocked ? { x: 2 } : {}}
                    className={`group ${btnClass}`}
                    onClick={() => selectAnswer(q, toChoiceKey(c.key))}
                    disabled={mode === 'practice' && isLocked}
                  >
                    <div className={keyClass}>{c.key}</div>
                    <span className="font-semibold text-lg sm:text-xl flex-1 leading-snug">{c.text}</span>
                  </motion.button>
                )
              })}
            </div>
            
              {/* Feedback Message */}
              {mode === 'practice' && isLocked && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-5 rounded-xl mt-8 font-semibold text-lg flex items-center gap-3 ${
                    isCorrect 
                      ? 'bg-[#F2F8F5] text-[#3F6347]' 
                      : 'bg-[#FCF5F5] text-[#8C464B]'
                  }`}
                >
                  {isCorrect ? '✓ Correct!' : `✗ Incorrect. The correct answer is ${q.answerKey}.`}
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Question Navigator (Desktop Right, Mobile Below) */}
        <aside className="surface-card p-4 sm:p-5 h-fit lg:sticky lg:top-24">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-semibold tracking-wider uppercase text-[#9B7A7A]">Question Map</p>
            <p className="text-xs text-[#787470]">{attemptedCount}/{questions.length}</p>
          </div>

          <div className="max-h-56 lg:max-h-[28rem] overflow-y-auto custom-scrollbar pr-1">
            <div className="grid grid-cols-6 gap-2">
              {questions.map((qq, i) => {
                const a = answers[qq.questionId]
                const isCurrent = i === idx
                return (
                  <motion.button
                    key={qq.questionId}
                    whileHover={!isCurrent ? { y: -2 } : {}}
                    whileTap={{ y: 0 }}
                    onClick={() => { setDirection(i > idx ? 1 : -1); setIdx(i) }}
                    className={`h-10 rounded-lg text-sm font-bold flex items-center justify-center transition-all
                      ${isCurrent 
                        ? 'gradient-accent text-white shadow-md' 
                        : a 
                          ? 'bg-[#F2F8F5] border border-[#A8CBAE] text-[#3F6347] hover:bg-[#A8CBAE] hover:text-white' 
                          : 'bg-white border border-[#E8E6DF] text-[#A8A4A0] hover:bg-[#FAF9F6] hover:text-[#787470]'
                      }`}
                  >
                    {i + 1}
                  </motion.button>
                )
              })}
            </div>
          </div>
        </aside>
      </div>

      {/* Navigation Footer */}
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-6">
        <motion.button 
          whileHover={idx !== 0 ? { x: -4 } : {}}
          onClick={() => go(-1)} 
          disabled={idx === 0}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-all
            ${idx === 0 
              ? 'text-[#A8A4A0] cursor-not-allowed bg-[#FAF9F6]' 
              : 'text-[#787470] hover:text-[#2C2A29] hover:bg-white border border-[#E8E6DF] hover:border-[#D6A3A3]/40'}`}
        >
          <LeftArrowIcon className="w-5 h-5" />
          Previous
        </motion.button>

        <div className="text-center text-sm text-[#787470]">
          <span className="font-semibold text-[#2C2A29]">{idx + 1}</span> of {questions.length}
        </div>

        <motion.button 
          whileHover={idx !== questions.length - 1 ? { x: 4 } : {}}
          onClick={() => go(1)} 
          disabled={idx === questions.length - 1}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-base font-semibold transition-all
            ${idx === questions.length - 1 
              ? 'text-[#A8A4A0] cursor-not-allowed bg-[#FAF9F6]' 
              : 'text-[#787470] hover:text-[#2C2A29] hover:bg-white border border-[#E8E6DF] hover:border-[#D6A3A3]/40'}`}
        >
          Next
          <RightArrowIcon className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  )
}
