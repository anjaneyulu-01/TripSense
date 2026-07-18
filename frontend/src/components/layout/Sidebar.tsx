import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Sparkles,
  Wallet,
  Luggage,
  CloudSun,
  BarChart3,
  MapPinned,
  Bookmark,
  Settings,
  X,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const items: NavItem[] = [
  { to: '/app', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/app/consultant', label: 'AI Consultant', icon: Sparkles },
  { to: '/app/budget', label: 'Budget Planner', icon: Wallet },
  { to: '/app/packing', label: 'Packing Checklist', icon: Luggage },
  { to: '/app/weather', label: 'Weather & Maps', icon: CloudSun },
  { to: '/app/trips', label: 'My Trips', icon: MapPinned },
  { to: '/app/analytics', label: 'Travel Analytics', icon: BarChart3 },
  { to: '/app/saved', label: 'Saved Trips', icon: Bookmark },
  { to: '/app/settings', label: 'Settings', icon: Settings },
]

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden
        />
      )}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-col p-4',
          'transition-transform duration-300 lg:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        {/* Logo card */}
        <div className="mb-4 flex items-center justify-between rounded-[var(--radius-lg)] border border-border bg-surface p-3.5 shadow-[var(--shadow-soft)]">
          <Logo />
          <button
            className="rounded-lg p-1.5 text-muted hover:bg-surface-2 lg:hidden"
            onClick={onClose}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav cards */}
        <nav className="flex-1 space-y-2 overflow-y-auto pb-2 [scrollbar-width:none]">
          {items.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  'group flex items-center gap-3 rounded-[var(--radius-md)] border px-3 py-2.5 text-sm transition-all',
                  isActive
                    ? 'border-primary/20 bg-primary/8 font-semibold text-primary'
                    : 'border-transparent font-medium text-foreground/80 hover:border-border hover:bg-surface',
                )
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={cn(
                      'grid h-8 w-8 shrink-0 place-items-center rounded-lg transition-colors',
                      isActive
                        ? 'brand-gradient text-white'
                        : 'text-muted group-hover:text-foreground',
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" />
                  </span>
                  <span className="flex-1">{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}
