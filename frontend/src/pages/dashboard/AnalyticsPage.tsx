import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { BarChart3, Sparkles, MapPinned, Wallet, Heart, CalendarDays } from 'lucide-react'
import { useTrips } from '@/lib/tripStore'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { formatCurrency } from '@/lib/utils'

export default function AnalyticsPage() {
  const trips = useTrips()

  const stats = useMemo(() => {
    const withBudget = trips.filter((t) => t.collected.budget)
    const totalBudget = withBudget.reduce((s, t) => s + (t.collected.budget ?? 0), 0)
    const avgBudget = withBudget.length ? Math.round(totalBudget / withBudget.length) : 0
    const totalDays = trips.reduce((s, t) => s + (t.collected.duration_days ?? 0), 0)
    const favorites = trips.filter((t) => t.favorite).length

    const interestCounts: Record<string, number> = {}
    for (const t of trips)
      for (const i of t.collected.interests) interestCounts[i] = (interestCounts[i] ?? 0) + 1
    const interests = Object.entries(interestCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8)

    const budgetByTrip = withBudget
      .slice(0, 8)
      .map((t) => ({ name: t.title.slice(0, 12), budget: t.collected.budget ?? 0 }))

    return { totalBudget, avgBudget, totalDays, favorites, interests, budgetByTrip }
  }, [trips])

  if (trips.length === 0) {
    return (
      <div className="space-y-6">
        <Header />
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-muted">
              <BarChart3 className="h-7 w-7" />
            </span>
            <h3 className="text-lg font-semibold text-foreground">No data yet</h3>
            <p className="max-w-sm text-sm text-muted">
              Save a few trips and your travel insights will appear here.
            </p>
            <Link to="/app/consultant" className="mt-1">
              <Button><Sparkles className="h-4 w-4" /> Plan a trip</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <Header />

      {/* Stat tiles */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={MapPinned} label="Trips planned" value={String(trips.length)} />
        <Stat icon={Wallet} label="Avg budget" value={formatCurrency(stats.avgBudget)} />
        <Stat icon={CalendarDays} label="Total days" value={String(stats.totalDays)} />
        <Stat icon={Heart} label="Favorites" value={String(stats.favorites)} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Budget by trip */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-3 font-semibold text-foreground">Budget by trip</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.budgetByTrip}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted))' }} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted))' }} width={48} />
                  <Tooltip
                    cursor={{ fill: 'hsl(var(--surface-2))' }}
                    formatter={(v) => formatCurrency(Number(v))}
                    contentStyle={{
                      borderRadius: 12,
                      border: '1px solid hsl(var(--border))',
                      background: 'hsl(var(--surface))',
                      color: 'hsl(var(--foreground))',
                    }}
                  />
                  <Bar dataKey="budget" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Top interests */}
        <Card>
          <CardContent className="pt-6">
            <h3 className="mb-3 font-semibold text-foreground">Top interests</h3>
            {stats.interests.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">No interests captured yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {stats.interests.map((i) => (
                  <Badge key={i.name} tone="accent" className="text-sm">
                    {i.name} · {i.count}
                  </Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function Header() {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-xl brand-gradient text-white shadow-[var(--shadow-glow)]">
        <BarChart3 className="h-5 w-5" />
      </span>
      <div>
        <h1 className="text-xl font-bold text-foreground">Travel Analytics</h1>
        <p className="text-sm text-muted">Insights across all your planned trips.</p>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, label, value }: { icon: typeof Wallet; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 pt-6">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </span>
        <div>
          <p className="text-xl font-bold text-foreground">{value}</p>
          <p className="text-xs text-muted">{label}</p>
        </div>
      </CardContent>
    </Card>
  )
}
