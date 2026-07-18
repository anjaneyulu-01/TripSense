import { Link } from 'react-router-dom'
import { MapPinned, Heart, Copy, Trash2, Sparkles, Calendar, Wallet } from 'lucide-react'
import { useTrips, tripStore, type SavedTrip } from '@/lib/tripStore'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency, cn } from '@/lib/utils'

export default function TripsPage() {
  const trips = useTrips()
  return <TripGrid trips={trips} title="My Trips" subtitle="Trips you've planned and saved." />
}

export function TripGrid({
  trips,
  title,
  subtitle,
  favoritesOnly,
}: {
  trips: SavedTrip[]
  title: string
  subtitle: string
  favoritesOnly?: boolean
}) {
  const list = favoritesOnly ? trips.filter((t) => t.favorite) : trips

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl brand-gradient text-white shadow-[var(--shadow-glow)]">
          <MapPinned className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">{title}</h1>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
      </div>

      {list.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-muted">
              <MapPinned className="h-7 w-7" />
            </span>
            <h3 className="text-lg font-semibold text-foreground">
              {favoritesOnly ? 'No favorites yet' : 'No saved trips yet'}
            </h3>
            <p className="max-w-sm text-sm text-muted">
              Plan a trip with the AI consultant and hit “Save this trip” once the
              details are collected.
            </p>
            <Link to="/app/consultant" className="mt-1">
              <Button><Sparkles className="h-4 w-4" /> Plan a trip</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {list.map((t) => (
            <Card key={t.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col pt-6">
                <div className="flex items-start justify-between gap-2">
                  <input
                    defaultValue={t.title}
                    onBlur={(e) => tripStore.rename(t.id, e.target.value.trim() || t.title)}
                    className="w-full rounded-md bg-transparent text-base font-semibold text-foreground focus:bg-surface-2 focus:px-2 focus:py-1 focus:outline-none"
                  />
                  <button
                    onClick={() => tripStore.toggleFavorite(t.id)}
                    aria-label="Favorite"
                    className="shrink-0 text-muted hover:text-danger"
                  >
                    <Heart className={cn('h-5 w-5', t.favorite && 'fill-danger text-danger')} />
                  </button>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {t.collected?.duration_days && (
                    <Badge tone="muted"><Calendar className="h-3 w-3" /> {t.collected.duration_days}d</Badge>
                  )}
                  {t.collected?.budget && (
                    <Badge tone="muted">
                      <Wallet className="h-3 w-3" />
                      {formatCurrency(t.collected.budget, t.collected.currency ?? 'INR')}
                    </Badge>
                  )}
                  {t.collected?.travel_type && <Badge tone="primary">{t.collected.travel_type}</Badge>}
                </div>

                {t.summary && (
                  <p className="mt-3 line-clamp-4 flex-1 text-sm text-muted">{t.summary}</p>
                )}

                <div className="mt-4 flex items-center gap-2 border-t border-border pt-3">
                  <Button size="sm" variant="ghost" onClick={() => tripStore.duplicate(t.id)}>
                    <Copy className="h-4 w-4" /> Duplicate
                  </Button>
                  <Button size="sm" variant="ghost" className="text-danger" onClick={() => tripStore.remove(t.id)}>
                    <Trash2 className="h-4 w-4" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
