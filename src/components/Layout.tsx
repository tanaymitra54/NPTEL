import { Link, NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'

function MenuIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="3" y1="12" x2="21" y2="12"></line>
      <line x1="3" y1="6" x2="21" y2="6"></line>
      <line x1="3" y1="18" x2="21" y2="18"></line>
    </svg>
  )
}

export default function Layout() {
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col font-sans text-slate-50">
      <header className="relative z-20 glass-effect border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex flex-col gap-0.5">
              <div className="font-bold text-lg tracking-tight text-slate-50 leading-none">
                Spanish Quiz
              </div>
              <div className="text-xs font-medium text-orange-400 tracking-wide">
                Final Exam Study Guide
              </div>
            </Link>
            
            <div className="hidden sm:flex space-x-8 items-center">
              <NavLink 
                to="/" 
                end 
                className={({ isActive }) => 
                  `text-sm font-medium transition-all ${isActive ? 'text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-50'}`
                }
              >
                Practice
              </NavLink>
              <NavLink 
                to="/stats" 
                className={({ isActive }) => 
                  `text-sm font-medium transition-all ${isActive ? 'text-orange-400 font-semibold' : 'text-slate-400 hover:text-slate-50'}`
                }
              >
                Progress
              </NavLink>
            </div>

            <button 
              className="sm:hidden p-2.5 text-slate-400 hover:text-slate-50 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden border-t border-white/10 bg-slate-900/60">
            <div className="flex flex-col px-4 pt-2 pb-4 space-y-1">
              <NavLink 
                to="/" 
                end 
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => 
                  `block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-50'}`
                }
              >
                Practice
              </NavLink>
              <NavLink 
                to="/stats" 
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => 
                  `block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-orange-500/20 text-orange-400' : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-50'}`
                }
              >
                Progress
              </NavLink>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full px-4 sm:px-6 lg:px-10 py-4 sm:py-6 lg:py-8 flex flex-col">
        <Outlet />
      </main>

      
    </div>
  )
}
