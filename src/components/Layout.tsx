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
    <div className="min-h-screen flex flex-col font-sans text-[#2C2A29]">
      <header className="relative z-20 glass-effect border-b border-[#E8E6DF]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <Link to="/" className="flex flex-col gap-0.5">
              <div className="font-bold text-lg tracking-tight text-[#2C2A29] leading-none">
                ESD Quiz
              </div>
              <div className="text-xs font-medium text-[#9B7A7A] tracking-wide">
                Education for Sustainable Development
              </div>
            </Link>
            
            <div className="hidden sm:flex space-x-8 items-center">
              <NavLink 
                to="/" 
                end 
                className={({ isActive }) => 
                  `text-sm font-medium transition-all ${isActive ? 'text-[#9B7A7A] font-semibold' : 'text-[#787470] hover:text-[#2C2A29]'}`
                }
              >
                Practice
              </NavLink>
              <NavLink 
                to="/stats" 
                className={({ isActive }) => 
                  `text-sm font-medium transition-all ${isActive ? 'text-[#9B7A7A] font-semibold' : 'text-[#787470] hover:text-[#2C2A29]'}`
                }
              >
                Progress
              </NavLink>
            </div>

            <button 
              className="sm:hidden p-2.5 text-[#787470] hover:text-[#2C2A29] transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              <MenuIcon />
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="sm:hidden border-t border-[#E8E6DF] bg-white">
            <div className="flex flex-col px-4 pt-2 pb-4 space-y-1">
              <NavLink 
                to="/" 
                end 
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => 
                  `block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-[#F0DADA] text-[#9B7A7A]' : 'text-[#787470] hover:bg-[#FAF9F6] hover:text-[#2C2A29]'}`
                }
              >
                Practice
              </NavLink>
              <NavLink 
                to="/stats" 
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) => 
                  `block px-3 py-2.5 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-[#F0DADA] text-[#9B7A7A]' : 'text-[#787470] hover:bg-[#FAF9F6] hover:text-[#2C2A29]'}`
                }
              >
                Progress
              </NavLink>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 flex flex-col">
        <Outlet />
      </main>

      
    </div>
  )
}
