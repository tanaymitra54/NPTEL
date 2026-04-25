import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { bank, getAssignmentLabelMap } from '../lib/questions'
import { clearAttempts, getAttempts, getPracticeStats } from '../lib/storage'

export default function Stats() {
  const attempts = getAttempts()
  const practice = getPracticeStats()
  const assignmentLabels = useMemo(() => getAssignmentLabelMap(bank.questions), [])

  const totals = useMemo(() => {
    let seen = 0
    let correct = 0
    let incorrect = 0
    for (const qid of Object.keys(practice)) {
      const s = practice[qid]
      seen += s.seen
      correct += s.correct
      incorrect += s.incorrect
    }
    return { seen, correct, incorrect }
  }, [practice])

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
          <h1 className="font-serif text-2xl font-semibold text-slate-50 mb-2">Your Statistics</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-slate-400">
            <span className="bg-slate-800/40 px-2.5 py-1 rounded-md border border-white/10">
              Bank: {bank.count} Questions
            </span>
            <span className="bg-slate-800/40 px-2.5 py-1 rounded-md border border-white/10">
              Saved: {attempts.length} Attempts
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link 
            to="/"
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-50 text-white hover:bg-slate-300 transition-colors"
          >
            Home
          </Link>
          <button
            type="button"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear your attempt history?')) {
                clearAttempts()
                window.location.reload()
              }
            }}
            title="Clears attempt history"
            className="px-5 py-2.5 rounded-lg text-sm font-medium bg-slate-900/60 border border-white/10 text-rose-400 hover:bg-rose-500/10 transition-colors"
          >
            Clear History
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="surface-card p-6 flex flex-col items-center justify-center text-center"
        >
          <div className="font-serif text-3xl font-semibold text-slate-50 mb-1">{totals.seen}</div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Practice Answers</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="surface-card p-6 flex flex-col items-center justify-center text-center"
        >
          <div className="font-serif text-3xl font-semibold text-emerald-400 mb-1">{totals.correct}</div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Correct</div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="surface-card p-6 flex flex-col items-center justify-center text-center"
        >
          <div className="font-serif text-3xl font-semibold text-rose-400 mb-1">{totals.incorrect}</div>
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Incorrect</div>
        </motion.div>
      </div>

      {/* History Table */}
      <div className="surface-card overflow-hidden">
        <div className="p-6 border-b border-white/10 bg-slate-800/40">
          <h2 className="text-lg font-medium text-slate-50">
            Attempt History
          </h2>
        </div>

        {attempts.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <p className="text-sm font-medium">No attempts yet. Time to start practicing!</p>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-900/60 border-b border-white/10 text-xs uppercase tracking-widest text-slate-500 font-semibold">
                  <th className="px-6 py-4 whitespace-nowrap">Date</th>
                  <th className="px-6 py-4 whitespace-nowrap">Mode</th>
                  <th className="px-6 py-4 whitespace-nowrap">Topics</th>
                  <th className="px-6 py-4 whitespace-nowrap">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E6DF] bg-slate-900/60">
                {attempts.map((a) => {
                  const pct = a.total ? Math.round((a.correct / a.total) * 1000) / 10 : 0
                  return (
                    <tr key={a.id} className="hover:bg-slate-800/40 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-50">
                        {new Date(a.createdAt).toLocaleString(undefined, {
                          month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-semibold capitalize
                          ${a.mode === 'exam' ? 'bg-orange-500/20 text-orange-600' : 'bg-emerald-500/10 text-emerald-400'}`}
                        >
                          {a.mode}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {a.assignmentIds.map((id) => assignmentLabels.get(id) ?? `Topic ${id}`).join(', ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-50">{a.correct}/{a.total}</span>
                          <span className="text-xs font-semibold px-2 py-0.5 rounded border border-white/10 text-slate-400">
                            {pct}%
                          </span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </motion.div>
  )
}
