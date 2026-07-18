import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Wallet,
  Luggage,
  CloudSun,
  Plane,
  ArrowRight,
  MapPinned,
  Server,
} from 'lucide-react'
import { systemApi } from '@/api/consult'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'

const widgets = [
  { icon: CloudSun, label: 'Weather at destination', value: '—', hint: 'Add a trip to see' },
  { icon: Wallet, label: 'Budget used', value: '—', hint: 'No active trip' },
  { icon: Luggage, label: 'Packing progress', value: '0%', hint: 'Nothing packed yet' },
  { icon: Plane, label: 'Trip countdown', value: '—', hint: 'No upcoming trip' },
]

export default function DashboardPage() {
  const { user } = useAuth()
  const { data: health } = useQuery({ queryKey: ['health'], queryFn: systemApi.health })

  const firstName = user?.full_name.split(' ')[0] ?? 'traveler'

  return (
    <div className="space-y-8">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {firstName} 👋
          </h1>
          <p className="mt-1 text-muted">Here's your travel command center.</p>
        </div>
        {health && (
          <Badge tone={health.primary_provider ? 'success' : 'warning'}>
            <Server className="h-3 w-3" />
            AI: {health.primary_provider ?? 'not configured'}
          </Badge>
        )}
      </div>

      {/* Hero CTA */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="overflow-hidden bg-gradient-to-br from-primary to-accent">
          <CardContent className="flex flex-col items-start gap-4 p-8 text-white sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-4">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-white/20">
                <Sparkles className="h-6 w-6" />
              </span>
              <div>
                <h2 className="text-xl font-semibold">Plan a new trip with AI</h2>
                <p className="mt-1 max-w-md text-white/85">
                  Tell the consultant your budget and dates — it handles the rest.
                </p>
              </div>
            </div>
            <Link to="/app/consultant">
              <Button variant="secondary" size="lg" className="bg-white text-primary hover:bg-white/90">
                Start planning <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </motion.div>

      {/* Command-center widgets */}
      <div>
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted">
          Command center
        </h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {widgets.map(({ icon: Icon, label, value, hint }, i) => (
            <motion.div
              key={label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: i * 0.05 }}
            >
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <span className="text-2xl font-bold text-foreground">{value}</span>
                </div>
                <p className="mt-3 text-sm font-medium text-foreground">{label}</p>
                <p className="text-xs text-muted">{hint}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Empty state for trips */}
      <Card className="flex flex-col items-center gap-3 p-12 text-center">
        <span className="grid h-14 w-14 place-items-center rounded-2xl bg-surface-2 text-muted">
          <MapPinned className="h-7 w-7" />
        </span>
        <h3 className="text-lg font-semibold text-foreground">No trips yet</h3>
        <p className="max-w-sm text-sm text-muted">
          Your planned trips will appear here. Start a conversation with the AI
          consultant to create your first one.
        </p>
        <Link to="/app/consultant" className="mt-2">
          <Button>
            <Sparkles className="h-4 w-4" /> Plan my first trip
          </Button>
        </Link>
      </Card>
    </div>
  )
}
