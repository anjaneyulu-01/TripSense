import {
  Wallet,
  CalendarDays,
  MapPin,
  Users,
  Heart,
  Plane,
  CheckCircle2,
  Circle,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'
import type { CollectedInfo } from '@/types'

interface Props {
  info: CollectedInfo | null
  readyToPlan: boolean
}

const ESSENTIALS = ['budget', 'duration_days', 'starting_city', 'travel_type', 'interests'] as const

export function CollectedInfoPanel({ info, readyToPlan }: Props) {
  const filled = info ? ESSENTIALS.filter((k) => isFilled(info[k])).length : 0
  const progress = Math.round((filled / ESSENTIALS.length) * 100)

  return (
    <div className="sticky top-24 space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">Trip details</h3>
          {readyToPlan ? (
            <Badge tone="success"><CheckCircle2 className="h-3 w-3" /> Ready</Badge>
          ) : (
            <Badge tone="muted">{progress}%</Badge>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="mt-5 space-y-3">
          <Row icon={Wallet} label="Budget" value={budgetText(info)} />
          <Row icon={CalendarDays} label="Duration" value={durationText(info)} />
          <Row icon={MapPin} label="From" value={info?.starting_city} />
          <Row icon={Plane} label="Destination" value={info?.destination} />
          <Row icon={Users} label="Travel type" value={capitalize(info?.travel_type)} />
        </div>

        {info?.interests && info.interests.length > 0 && (
          <div className="mt-5">
            <div className="mb-2 flex items-center gap-2 text-sm text-muted">
              <Heart className="h-4 w-4" /> Interests
            </div>
            <div className="flex flex-wrap gap-1.5">
              {info.interests.map((i) => (
                <Badge key={i} tone="accent">{i}</Badge>
              ))}
            </div>
          </div>
        )}
      </Card>

      {!info && (
        <p className="px-1 text-xs text-muted">
          As you chat, the consultant fills this in automatically — and never
          re-asks for something you've already told it.
        </p>
      )}
    </div>
  )
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Wallet
  label: string
  value?: string | null
}) {
  const has = Boolean(value)
  return (
    <div className="flex items-center gap-3">
      {has ? (
        <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
      ) : (
        <Circle className="h-4 w-4 shrink-0 text-border" />
      )}
      <Icon className="h-4 w-4 shrink-0 text-muted" />
      <span className="text-sm text-muted">{label}</span>
      <span className="ml-auto truncate text-sm font-medium text-foreground">
        {value ?? '—'}
      </span>
    </div>
  )
}

// --- helpers ---
function isFilled(v: unknown): boolean {
  if (Array.isArray(v)) return v.length > 0
  return v !== null && v !== undefined && v !== ''
}

function budgetText(info: CollectedInfo | null): string | null {
  if (!info?.budget) return null
  return formatCurrency(info.budget, info.currency ?? 'INR')
}

function durationText(info: CollectedInfo | null): string | null {
  if (!info?.duration_days) return null
  return `${info.duration_days} day${info.duration_days > 1 ? 's' : ''}`
}

function capitalize(v?: string | null): string | null {
  if (!v) return null
  return v.charAt(0).toUpperCase() + v.slice(1)
}
