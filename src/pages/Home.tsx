import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { bank, getAssignments, pickQuestions } from '../lib/questions'
import { normalizeWeeks } from '../lib/selection'
import { BookIcon, CheckIcon } from '../components/Icons'

const DEFAULT_WEEK = 12
const FIXED_MODE = 'practice'
const FIXED_COUNT = 'all'

export default function Home() {
  const assignments = useMemo(() => getAssignments(bank.questions), [])
  const [selectedWeeks, setSelectedWeeks] = useState<number[]>([DEFAULT_WEEK])
  const [shuffle, setShuffle] = useState(true)

  // Get assignment IDs from normalized weeks (always use all selected weeks for now)
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
          <span className="text-2xl text-white font-bold">ESD</span>
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight text-[#2C2A29] leading-tight">
          Master Sustainable Development
        </h1>
        <p className="text-xl text-[#787470] max-w-2xl mx-auto leading-relaxed">
          Comprehensive quiz practice with guided learning mode. Perfect your knowledge before assessment.
        </p>
      </motion.div>

      {/* Control Panel */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="surface-elevated p-8 sm:p-10 space-y-8"
      >
        {/* Week Selection Grid */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-[#2C2A29]">Select Topics</h2>
              <p className="text-sm text-[#787470] mt-1">Choose which weeks to practice</p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedWeeks(assignments.map((a) => a.id))}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-[#D6A3A3] text-[#9B7A7A] bg-white hover:bg-[#F0DADA]/40 transition-all duration-300"
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
                        return [...prev, a.id].sort((x, y) => y - x)
                      }
                    })
                  }}
                  disabled={disabled}
                  className={`flex flex-col items-center justify-center px-3 py-4 rounded-xl border text-sm font-semibold transition-all duration-300 ${
                    checked
                      ? 'gradient-accent text-white border-transparent shadow-md'
                      : 'bg-white border-[#E8E6DF] text-[#787470] hover:border-[#D6A3A3]/40 hover:shadow-sm'
                  } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span>W{a.id}</span>
                  <span className="text-xs opacity-70 mt-1">{a.count}Q</span>
                </motion.button>
              )
            })}
          </div>
          <p className="text-sm text-[#787470] pl-1">
            <span className="font-medium text-[#2C2A29]">{selectedWeeks.length}</span> week{selectedWeeks.length !== 1 ? 's' : ''} • 
            <span className="font-medium text-[#2C2A29] ml-1">{selectedQuestions.length}</span> questions
          </p>
        </div>

        {/* Settings Section */}
        <div className="border-t border-[#E8E6DF] pt-8 space-y-6">
          <h3 className="text-lg font-semibold text-[#2C2A29]">Session Settings</h3>
          
          <div className="flex items-center justify-between p-4 bg-[#FAF9F6] rounded-xl border border-[#E8E6DF]">
            <div>
              <p className="font-medium text-[#2C2A29]">Shuffle Questions</p>
              <p className="text-xs text-[#787470] mt-1">Randomize the order of questions</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={shuffle}
                onChange={(e) => setShuffle(e.target.checked)}
              />
              <div className="w-11 h-6 bg-[#E8E6DF] rounded-full peer peer-checked:after:translate-x-5 after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D6A3A3] peer-checked:shadow-md"></div>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="border-t border-[#E8E6DF] pt-8 space-y-4 sm:space-y-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <Link
              to="/stats"
              className="inline-flex items-center justify-center px-6 py-3.5 text-sm font-semibold text-[#2C2A29] bg-white border border-[#E8E6DF] rounded-xl hover:bg-[#FAF9F6] transition-all duration-300 hover:border-[#D6A3A3]/30"
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
