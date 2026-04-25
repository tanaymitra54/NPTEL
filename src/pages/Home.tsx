import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { bank, getAssignments, pickQuestions } from '../lib/questions'
import { normalizeWeeks } from '../lib/selection'
import { BookIcon, CheckIcon } from '../components/Icons'

const DEFAULT_WEEK = 1
const FIXED_MODE = 'practice'
const FIXED_COUNT = 'all'

export default function Home() {
  const assignments = useMemo(() => getAssignments(bank.questions), [])
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([DEFAULT_WEEK])
  const [shuffle, setShuffle] = useState(true)

  const assignmentIds = useMemo(() => {
    const normalized = normalizeWeeks(selectedWeeks, 'mixed', DEFAULT_WEEK)
    return normalized
  }, [selectedWeeks])

  const selectedQuestions = useMemo(() => {
    return pickQuestions(bank.questions, assignmentIds, FIXED_COUNT, shuffle)
  }, [assignmentIds, shuffle])

  const startHref = useMemo(() => {
    const params = new URLSearchParams()
    params.set('mode', FIXED_MODE)
    params.set('shuffle', shuffle ? '1' : '0')
    params.set('count', FIXED_COUNT === 'all' ? 'all' : String(FIXED_COUNT))
    params.set('weeks', assignmentIds.join(','))
    params.set('grouping', 'mixed')
    return `/run?${params.toString()}`
  }, [assignmentIds, shuffle])

  const learnHref = useMemo(() => {
    const params = new URLSearchParams()
    params.set('weeks', assignmentIds.join(','))
    params.set('grouping', 'mixed')
    return `/learn?${params.toString()}`
  }, [assignmentIds])

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto space-y-8 pb-20 w-full"
    >
      {/* Hero Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="text-center space-y-4 py-12 sm:py-16 soft-float"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-accent mb-4">
          <span className="font-serif text-2xl text-white font-bold">ES</span>
        </div>
        <h1 className="font-serif text-5xl sm:text-6xl font-bold tracking-tight text-slate-50 leading-tight">
          Master Spanish MCQs
        </h1>
        <p className="text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Practice all 183 study-guide questions by topic, with instant feedback and guided review.
        </p>
      </motion.div>

      {/* Control Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="surface-elevated p-8 sm:p-10 space-y-8"
      >
         {/* Topic Selection Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-2xl font-bold text-slate-50">Select Topics</h2>
              <p className="text-sm text-slate-400 mt-1">Choose which grammar areas to practice</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedWeeks(assignments.map((a) => a.id))}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-orange-500 text-orange-400 bg-slate-900/60 hover:bg-orange-500/20/40 transition-all duration-300"
            >
              Select All
            </button>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {assignments.map((a) => {
              const checked = selectedWeeks.includes(a.id)
              const isLastSelected = checked && selectedWeeks.length === 1
              const disabled = isLastSelected

              return (
                <motion.button
                  key={a.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  type="button"
                  onClick={() => {
                    setSelectedWeeks((prev) => {
                      if (checked) {
                        const next = prev.filter((w) => w !== a.id)
                        return next.length > 0 ? next : prev
                      } else {
                        return [...prev, a.id].sort((x, y) => x - y)
                      }
                    })
                  }}
                  disabled={disabled}
                  className={`flex flex-col items-center justify-center px-3 py-4 rounded-xl border text-sm font-semibold transition-all duration-300 ${
                      checked
                        ? 'gradient-accent text-white border-transparent shadow-md'
                        : 'bg-slate-900/60 border-white/10 text-slate-400 hover:border-orange-500/40 hover:shadow-sm'
                   } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                 >
                   <span className="text-center leading-tight">{a.label}</span>
                   <span className="text-xs opacity-70 mt-1">{a.count}Q</span>
                 </motion.button>
               )
            })}
          </div>
          <p className="text-sm text-slate-400 pl-1">
            <span className="font-medium text-slate-50">{selectedWeeks.length}</span> topic{selectedWeeks.length !== 1 ? 's' : ''} • 
            <span className="font-medium text-slate-50 ml-1">{selectedQuestions.length}</span> questions
          </p>
        </div>

        {/* Settings Section */}
        <div className="border-t border-white/10 pt-8 space-y-6">
          <h3 className="text-lg font-semibold text-slate-50">Session Settings</h3>
          
          <div className="flex items-center justify-between p-4 bg-slate-800/40 rounded-xl border border-white/10">
            <div>
              <p className="font-medium text-slate-50">Shuffle Questions</p>
              <p className="text-xs text-slate-400 mt-1">Randomize the order of questions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={shuffle}
                onChange={(e) => setShuffle(e.target.checked)}
              />
              <div className="w-11 h-6 bg-slate-900/60/10 rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-900/60 after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500 peer-checked:shadow-md"></div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-white/10 pt-8 space-y-4 sm:space-y-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Link
              to="/stats"
              className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-slate-50 bg-slate-900/60 border border-white/10 rounded-xl hover:bg-slate-800/40 transition-all duration-300 hover:border-orange-500/30"
            >
              View Progress
            </Link>
            <Link
              to={learnHref}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white gradient-dark rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <BookIcon className="w-5 h-5" />
              Learn Mode
            </Link>
            <Link
              to={startHref}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm font-semibold text-white gradient-accent rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
            >
              <CheckIcon className="w-5 h-5" />
              Begin Practice
            </Link>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
