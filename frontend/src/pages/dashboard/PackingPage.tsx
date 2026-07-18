import { useMemo, useState } from 'react'
import { Luggage, Check, RotateCcw } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

type TripType = 'beach' | 'mountains' | 'business' | 'adventure' | 'city'

const TRIP_TYPES: { value: TripType; label: string; emoji: string }[] = [
  { value: 'beach', label: 'Beach', emoji: '🏖️' },
  { value: 'mountains', label: 'Mountains', emoji: '⛰️' },
  { value: 'city', label: 'City', emoji: '🏙️' },
  { value: 'business', label: 'Business', emoji: '💼' },
  { value: 'adventure', label: 'Adventure', emoji: '🥾' },
]

const BASE: Record<string, string[]> = {
  Essentials: ['Passport / ID', 'Wallet & cards', 'Phone & charger', 'Travel tickets', 'Reusable water bottle'],
  Clothing: ['T-shirts', 'Underwear & socks', 'Comfortable walking shoes', 'Sleepwear'],
  Toiletries: ['Toothbrush & paste', 'Deodorant', 'Sunscreen', 'Basic medicines'],
}

const BY_TYPE: Record<TripType, Record<string, string[]>> = {
  beach: { Beach: ['Swimwear', 'Flip-flops', 'Beach towel', 'Sunglasses', 'After-sun lotion'] },
  mountains: { Mountains: ['Warm jacket', 'Thermal layers', 'Hiking boots', 'Gloves & beanie', 'Trekking poles'] },
  city: { City: ['Day backpack', 'Power bank', 'Comfortable outfit', 'Umbrella'] },
  business: { Business: ['Formal outfits', 'Laptop & charger', 'Business cards', 'Notebook & pen'] },
  adventure: { Adventure: ['First-aid kit', 'Headlamp', 'Quick-dry clothes', 'Multi-tool', 'Energy bars'] },
}

const CONDITIONAL: Record<string, Record<string, string[]>> = {
  children: { 'For children': ['Snacks', 'Favorite toy', 'Extra clothes', 'Wet wipes'] },
  elderly: { 'For seniors': ['Prescription medicines', 'Comfort cushion', 'Medical documents'] },
  women: { Extras: ['Feminine hygiene products', 'Jewelry pouch'] },
}

function buildList(type: TripType, flags: Record<string, boolean>, days: number) {
  const groups: Record<string, string[]> = { ...structuredClone(BASE) }
  // Scale a couple of quantities loosely with duration.
  if (days > 5) groups.Clothing = [...groups.Clothing, 'Extra outfits for a long trip', 'Laundry bag']
  Object.assign(groups, BY_TYPE[type])
  for (const [flag, on] of Object.entries(flags)) {
    if (on && CONDITIONAL[flag]) Object.assign(groups, CONDITIONAL[flag])
  }
  return groups
}

export default function PackingPage() {
  const [type, setType] = useState<TripType>('beach')
  const [days, setDays] = useState(5)
  const [flags, setFlags] = useState<Record<string, boolean>>({
    children: false,
    elderly: false,
    women: false,
  })
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const groups = useMemo(() => buildList(type, flags, days), [type, flags, days])
  const allItems = useMemo(() => Object.values(groups).flat(), [groups])
  const packed = allItems.filter((i) => checked[i]).length
  const progress = allItems.length ? Math.round((packed / allItems.length) * 100) : 0

  const toggle = (item: string) => setChecked((c) => ({ ...c, [item]: !c[item] }))
  const resetChecks = () => setChecked({})

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl brand-gradient text-white shadow-[var(--shadow-glow)]">
          <Luggage className="h-5 w-5" />
        </span>
        <div>
          <h1 className="text-xl font-bold text-foreground">Packing Checklist</h1>
          <p className="text-sm text-muted">A personalized list you can tick off as you pack.</p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="flex flex-wrap items-center gap-4 pt-6">
          <div className="flex flex-wrap gap-2">
            {TRIP_TYPES.map((t) => (
              <button
                key={t.value}
                onClick={() => setType(t.value)}
                className={cn(
                  'pill border transition-colors',
                  type === t.value
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border bg-surface text-muted hover:text-foreground',
                )}
              >
                <span>{t.emoji}</span> {t.label}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm text-muted">
            Days
            <input
              type="number"
              min={1}
              max={60}
              value={days}
              onChange={(e) => setDays(Math.max(1, Number(e.target.value)))}
              className="w-16 rounded-lg border border-input bg-surface-2 px-2 py-1 text-foreground focus:border-primary focus:outline-none"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {Object.keys(flags).map((flag) => (
              <button
                key={flag}
                onClick={() => setFlags((f) => ({ ...f, [flag]: !f[flag] }))}
                className={cn(
                  'pill border capitalize transition-colors',
                  flags[flag]
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border bg-surface text-muted hover:text-foreground',
                )}
              >
                {flag === 'women' ? 'Traveling as a woman' : flag}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">
              {packed} of {allItems.length} packed
            </p>
            <div className="flex items-center gap-3">
              <span className="text-sm font-bold text-primary">{progress}%</span>
              <Button variant="ghost" size="sm" onClick={resetChecks}>
                <RotateCcw className="h-4 w-4" /> Reset
              </Button>
            </div>
          </div>
          <div className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full brand-gradient transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Groups */}
      <div className="grid gap-6 md:grid-cols-2">
        {Object.entries(groups).map(([group, items]) => (
          <Card key={group}>
            <CardContent className="pt-6">
              <h3 className="mb-3 font-semibold text-foreground">{group}</h3>
              <ul className="space-y-1.5">
                {items.map((item) => {
                  const on = Boolean(checked[item])
                  return (
                    <li key={item}>
                      <button
                        onClick={() => toggle(item)}
                        className="flex w-full items-center gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-surface-2"
                      >
                        <span
                          className={cn(
                            'grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors',
                            on ? 'brand-gradient border-transparent text-white' : 'border-border',
                          )}
                        >
                          {on && <Check className="h-3.5 w-3.5" />}
                        </span>
                        <span className={cn(on ? 'text-muted line-through' : 'text-foreground')}>
                          {item}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
