import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Settings as SettingsIcon, Moon, Sun, Globe2, Volume2, Server, User } from 'lucide-react'
import { systemApi } from '@/api/consult'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { cn } from '@/lib/utils'
import type { Language } from '@/types'

const LANGS: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी (Hindi)' },
  { value: 'te', label: 'తెలుగు (Telugu)' },
]

export default function SettingsPage() {
  const { theme, toggleTheme } = useTheme()
  const { user, isGuest } = useAuth()
  const { data: health } = useQuery({ queryKey: ['health'], queryFn: systemApi.health })

  const [lang, setLang] = useState<Language>(
    () => (localStorage.getItem('tripsense.lang') as Language) || 'en',
  )
  const [voice, setVoice] = useState(
    () => localStorage.getItem('tripsense.voice') !== 'off',
  )

  const setLanguage = (l: Language) => {
    setLang(l)
    localStorage.setItem('tripsense.lang', l)
  }
  const setVoicePref = (on: boolean) => {
    setVoice(on)
    localStorage.setItem('tripsense.voice', on ? 'on' : 'off')
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl brand-gradient text-white shadow-[var(--shadow-glow)]">
          <SettingsIcon className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">Settings</h1>
          <p className="text-sm text-muted">Personalize your TripSense experience.</p>
        </div>
      </div>

      {/* Appearance */}
      <Card>
        <CardContent className="pt-6">
          <Row icon={theme === 'dark' ? Moon : Sun} title="Theme" desc="Switch between light and dark mode.">
            <div className="flex rounded-full border border-border p-1">
              {(['light', 'dark'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    if (t !== theme) toggleTheme()
                  }}
                  className={cn(
                    'rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors',
                    theme === t ? 'brand-gradient text-white' : 'text-muted',
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </Row>

          <Divider />

          <Row icon={Globe2} title="Preferred language" desc="Default language for the AI consultant.">
            <select
              value={lang}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="rounded-full border border-input bg-surface-2 px-4 py-2 text-sm text-foreground focus:border-primary focus:outline-none"
            >
              {LANGS.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </Row>

          <Divider />

          <Row icon={Volume2} title="Voice replies" desc="Let the consultant speak its answers aloud.">
            <Toggle on={voice} onChange={setVoicePref} />
          </Row>
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardContent className="pt-6">
          <Row icon={User} title="Account" desc={isGuest ? 'You are exploring as a guest.' : 'Your account details.'}>
            <div className="text-right">
              <p className="text-sm font-medium text-foreground">{user?.full_name}</p>
              <p className="text-xs text-muted">{user?.email}</p>
            </div>
          </Row>
          <Divider />
          <Row icon={Server} title="AI model status" desc="Live provider health.">
            <Badge tone={health?.primary_provider ? 'success' : 'warning'}>
              {health?.primary_provider ?? 'offline'}
            </Badge>
          </Row>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({
  icon: Icon,
  title,
  desc,
  children,
}: {
  icon: typeof Moon
  title: string
  desc: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-2">
      <div className="flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-2 text-muted">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="font-medium text-foreground">{title}</p>
          <p className="text-xs text-muted">{desc}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function Divider() {
  return <div className="my-2 h-px bg-border" />
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      onClick={() => onChange(!on)}
      className={cn('relative h-7 w-12 rounded-full transition-colors', on ? 'bg-primary' : 'bg-surface-2')}
      aria-pressed={on}
    >
      <span
        className={cn(
          'absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform',
          on ? 'translate-x-6' : 'translate-x-1',
        )}
      />
    </button>
  )
}
