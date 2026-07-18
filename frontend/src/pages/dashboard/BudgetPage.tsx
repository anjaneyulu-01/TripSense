import { useMemo, useState } from 'react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Wallet, Sparkles, RotateCcw, TrendingDown } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { formatCurrency } from '@/lib/utils'

interface Category {
  key: string
  label: string
  pct: number // default share of total
  color: string
}

// Distinct, accessible categorical hues (brand-anchored).
const DEFAULTS: Category[] = [
  { key: 'transport', label: 'Transport', pct: 25, color: '#7c5cff' },
  { key: 'hotels', label: 'Hotels', pct: 30, color: '#4f7cff' },
  { key: 'food', label: 'Food', pct: 18, color: '#22b07d' },
  { key: 'activities', label: 'Activities', pct: 12, color: '#f5a524' },
  { key: 'shopping', label: 'Shopping', pct: 7, color: '#ec4899' },
  { key: 'emergency', label: 'Emergency', pct: 5, color: '#ef4444' },
  { key: 'misc', label: 'Miscellaneous', pct: 3, color: '#64748b' },
]

export default function BudgetPage() {
  const [total, setTotal] = useState(50000)
  const [currency] = useState('INR')
  const [amounts, setAmounts] = useState<Record<string, number>>(() =>
    Object.fromEntries(DEFAULTS.map((c) => [c.key, Math.round((c.pct / 100) * 50000)])),
  )

  const allocated = useMemo(
    () => Object.values(amounts).reduce((a, b) => a + (b || 0), 0),
    [amounts],
  )
  const remaining = total - allocated

  const chartData = DEFAULTS.map((c) => ({
    name: c.label,
    value: amounts[c.key] || 0,
    color: c.color,
  })).filter((d) => d.value > 0)

  const applyTotal = (next: number) => {
    setTotal(next)
    // Re-derive amounts from default percentages when total changes.
    setAmounts(Object.fromEntries(DEFAULTS.map((c) => [c.key, Math.round((c.pct / 100) * next)])))
  }

  const reset = () => applyTotal(total)

  const savingsTips = useMemo(() => {
    const tips: string[] = []
    const share = (k: string) => (total ? (amounts[k] / total) * 100 : 0)
    if (share('hotels') > 35) tips.push('Hotels exceed 35% — consider guesthouses or shifting a night to travel days.')
    if (share('shopping') > 12) tips.push('Shopping is high — set a hard cap to protect your reserve.')
    if (remaining < 0) tips.push('You are over budget — trim the largest category or raise the total.')
    if (share('emergency') < 5) tips.push('Keep at least 5% as an emergency reserve for peace of mind.')
    if (!tips.length) tips.push('Nicely balanced! Book transport and hotels early to lock in these numbers.')
    return tips
  }, [amounts, remaining, total])

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Wallet}
        title="Budget Planner"
        subtitle="Break your trip budget into categories and optimize it live."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Left: inputs + categories */}
        <div className="space-y-6">
          <Card>
            <CardContent className="flex flex-wrap items-end gap-4 pt-6">
              <div className="w-48">
                <Input
                  label="Total budget"
                  type="number"
                  min={0}
                  value={total}
                  onChange={(e) => applyTotal(Math.max(0, Number(e.target.value)))}
                  icon={<span className="text-sm">₹</span>}
                />
              </div>
              <Button variant="outline" onClick={reset}>
                <RotateCcw className="h-4 w-4" /> Reset split
              </Button>
              <div className="ml-auto text-right">
                <p className="text-xs text-muted">Remaining</p>
                <p className={`text-xl font-bold ${remaining < 0 ? 'text-danger' : 'text-success'}`}>
                  {formatCurrency(remaining, currency)}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-3 pt-6">
              {DEFAULTS.map((c) => {
                const value = amounts[c.key] || 0
                const pct = total ? Math.round((value / total) * 100) : 0
                return (
                  <div key={c.key} className="flex items-center gap-3">
                    <span className="h-3 w-3 shrink-0 rounded-full" style={{ background: c.color }} />
                    <span className="w-28 shrink-0 text-sm font-medium text-foreground">{c.label}</span>
                    <input
                      type="range"
                      min={0}
                      max={total}
                      value={value}
                      onChange={(e) =>
                        setAmounts((a) => ({ ...a, [c.key]: Number(e.target.value) }))
                      }
                      className="flex-1 accent-[var(--color-primary)]"
                    />
                    <span className="w-24 text-right text-sm font-semibold text-foreground">
                      {formatCurrency(value, currency)}
                    </span>
                    <Badge tone="muted" className="w-12 justify-center">{pct}%</Badge>
                  </div>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Right: chart + tips */}
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <h3 className="mb-2 font-semibold text-foreground">Allocation</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {chartData.map((d) => (
                        <Cell key={d.name} fill={d.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(v) => formatCurrency(Number(v), currency)}
                      contentStyle={{
                        borderRadius: 12,
                        border: '1px solid hsl(var(--border))',
                        background: 'hsl(var(--surface))',
                        color: 'hsl(var(--foreground))',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 text-center">
                <p className="text-xs text-muted">Allocated</p>
                <p className="text-lg font-bold text-foreground">{formatCurrency(allocated, currency)}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="space-y-2 pt-6">
              <h3 className="flex items-center gap-2 font-semibold text-foreground">
                <TrendingDown className="h-4 w-4 text-primary" /> Savings suggestions
              </h3>
              <ul className="space-y-2">
                {savingsTips.map((t) => (
                  <li key={t} className="flex gap-2 text-sm text-muted">
                    <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" /> {t}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

function PageHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: typeof Wallet
  title: string
  subtitle: string
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid h-11 w-11 place-items-center rounded-xl brand-gradient text-white shadow-[var(--shadow-glow)]">
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h1 className="text-xl font-bold text-foreground">{title}</h1>
        <p className="text-sm text-muted">{subtitle}</p>
      </div>
    </div>
  )
}
