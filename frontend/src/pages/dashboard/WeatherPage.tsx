import { useState, type FormEvent } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CloudSun, Search, Wind, Droplets, MapPin, Info } from 'lucide-react'
import { getWeather, describeWeather, travelAdvice } from '@/api/weather'
import { Card, CardContent } from '@/components/ui/Card'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { Spinner } from '@/components/ui/Spinner'

const WEEKDAY = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

export default function WeatherPage() {
  const [query, setQuery] = useState('')
  const [city, setCity] = useState('Goa')

  const { data, isFetching, isError } = useQuery({
    queryKey: ['weather', city],
    queryFn: () => getWeather(city),
    enabled: Boolean(city),
    staleTime: 10 * 60_000,
  })

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = query.trim()
    if (q) setCity(q)
  }

  const mapSrc = data
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${data.place.longitude - 0.15}%2C${
        data.place.latitude - 0.1
      }%2C${data.place.longitude + 0.15}%2C${data.place.latitude + 0.1}&layer=mapnik&marker=${
        data.place.latitude
      }%2C${data.place.longitude}`
    : ''

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="grid h-11 w-11 place-items-center rounded-xl brand-gradient text-white shadow-[var(--shadow-glow)]">
            <CloudSun className="h-5 w-5" />
          </span>
          <div>
            <h1 className="text-xl font-bold text-foreground">Weather &amp; Maps</h1>
            <p className="text-sm text-muted">Check conditions and location for any destination.</p>
          </div>
        </div>
        <form onSubmit={onSubmit} className="flex w-full max-w-sm items-end gap-2">
          <Input
            placeholder="Search a city…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
          <Button type="submit">Search</Button>
        </form>
      </div>

      {isFetching && (
        <div className="flex justify-center py-16"><Spinner className="h-7 w-7" /></div>
      )}
      {isError && (
        <Card><CardContent className="py-10 text-center text-danger">Couldn’t load weather. Try another city.</CardContent></Card>
      )}
      {!isFetching && data === null && (
        <Card><CardContent className="py-10 text-center text-muted">No place found for “{city}”.</CardContent></Card>
      )}

      {data && !isFetching && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Current + forecast */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2 text-sm text-muted">
                  <MapPin className="h-4 w-4" />
                  {data.place.name}
                  {data.place.admin1 ? `, ${data.place.admin1}` : ''}, {data.place.country}
                </div>
                <div className="mt-3 flex items-center gap-4">
                  <span className="text-6xl">{describeWeather(data.current.weatherCode).emoji}</span>
                  <div>
                    <p className="text-4xl font-extrabold text-foreground">{data.current.temp}°C</p>
                    <p className="text-muted">{describeWeather(data.current.weatherCode).label}</p>
                  </div>
                </div>
                <div className="mt-4 flex gap-4 text-sm text-muted">
                  <span className="flex items-center gap-1.5"><Wind className="h-4 w-4" /> {data.current.windSpeed} km/h</span>
                  <span className="flex items-center gap-1.5"><Droplets className="h-4 w-4" /> {data.current.humidity}%</span>
                </div>
                <div className="mt-4 flex items-start gap-2 rounded-[var(--radius-md)] bg-primary/8 p-3 text-sm text-foreground">
                  <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {travelAdvice(data)}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <h3 className="mb-3 font-semibold text-foreground">7-day forecast</h3>
                <div className="grid grid-cols-7 gap-2">
                  {data.daily.map((d) => (
                    <div key={d.date} className="rounded-[var(--radius-md)] bg-surface-2 p-2 text-center">
                      <p className="text-xs font-medium text-muted">
                        {WEEKDAY[new Date(d.date).getDay()]}
                      </p>
                      <p className="my-1 text-xl">{describeWeather(d.weatherCode).emoji}</p>
                      <p className="text-xs font-semibold text-foreground">{d.tempMax}°</p>
                      <p className="text-xs text-muted">{d.tempMin}°</p>
                      <p className="mt-1 text-[10px] text-accent">{d.rainProb}%💧</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Map */}
          <Card className="overflow-hidden">
            <div className="border-b border-border px-6 py-3 text-sm font-semibold text-foreground">
              Location map
            </div>
            <iframe
              title={`Map of ${data.place.name}`}
              src={mapSrc}
              className="h-[420px] w-full border-0"
              loading="lazy"
            />
          </Card>
        </div>
      )}
    </div>
  )
}
