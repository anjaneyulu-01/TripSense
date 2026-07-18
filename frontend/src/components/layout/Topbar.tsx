import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Menu, LogOut, Moon, Sun, Crown, Wifi, WifiOff } from 'lucide-react'
import { systemApi } from '@/api/consult'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const { user, isGuest, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const { data: health } = useQuery({
    queryKey: ['health'],
    queryFn: systemApi.health,
    refetchInterval: 60_000,
  })
  const aiOnline = Boolean(health?.primary_provider)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-border/60 glass">
      <div className="flex items-center gap-3 px-4 py-4 lg:px-8">
        <button
          className="rounded-lg p-2 text-muted hover:bg-surface-2 lg:hidden"
          onClick={onMenu}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Eyebrow + gradient headline */}
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted">
            TripSense AI
          </p>
          <h1 className="truncate text-xl font-extrabold tracking-tight sm:text-2xl">
            <span className="text-gradient">Plan your perfect journey.</span>
          </h1>
        </div>

        {/* Right controls */}
        <div className="ml-auto flex items-center gap-2">
          {/* Guest badge / Premium (UI only) */}
          {isGuest ? (
            <button
              onClick={() => navigate('/register')}
              className="pill bg-gradient-to-r from-primary to-accent text-white"
              title="Create a free account to keep your trips"
            >
              <Crown className="h-3.5 w-3.5" /> Guest · Save account
            </button>
          ) : (
            <span className="pill hidden bg-gradient-to-r from-warning to-warning/80 text-white sm:inline-flex">
              <Crown className="h-3.5 w-3.5" /> Premium
            </span>
          )}

          {/* AI status */}
          <span
            className={cn(
              'pill hidden md:inline-flex',
              aiOnline ? 'bg-success/12 text-success' : 'bg-warning/15 text-warning',
            )}
            title={health?.primary_provider ? `Primary: ${health.primary_provider}` : undefined}
          >
            {aiOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            {aiOnline ? 'AI healthy' : 'AI offline'}
          </span>

          {/* Theme pill */}
          <button
            onClick={toggleTheme}
            className="pill border border-border bg-surface text-foreground hover:bg-surface-2"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
            <span className="uppercase tracking-wide">{theme}</span>
          </button>

          {/* Avatar + menu */}
          <div className="relative" ref={ref}>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className="grid h-10 w-10 place-items-center rounded-full brand-gradient text-sm font-semibold text-white shadow-[var(--shadow-soft)]"
              aria-label="Account menu"
            >
              {user ? initials(user.full_name) : '?'}
            </button>
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-[var(--radius-md)] border border-border bg-surface shadow-[var(--shadow-soft)]">
                <div className="border-b border-border px-4 py-3">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {user?.full_name}
                  </p>
                  <p className="truncate text-xs text-muted">{user?.email}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-danger hover:bg-surface-2"
                >
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
