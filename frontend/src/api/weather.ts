/**
 * Weather + geocoding via Open-Meteo — free, no API key, CORS-friendly.
 * These call the public API directly (not through our backend proxy).
 */

export interface GeoPlace {
  name: string
  country: string
  admin1?: string
  latitude: number
  longitude: number
}

export interface DailyForecast {
  date: string
  weatherCode: number
  tempMax: number
  tempMin: number
  rainProb: number
}

export interface WeatherResult {
  place: GeoPlace
  current: {
    temp: number
    weatherCode: number
    windSpeed: number
    humidity: number
    isDay: boolean
  }
  daily: DailyForecast[]
}

const GEO = 'https://geocoding-api.open-meteo.com/v1/search'
const FORECAST = 'https://api.open-meteo.com/v1/forecast'

export async function geocodeCity(query: string): Promise<GeoPlace | null> {
  const url = `${GEO}?name=${encodeURIComponent(query)}&count=1&language=en&format=json`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Geocoding failed')
  const data = await res.json()
  const r = data.results?.[0]
  if (!r) return null
  return {
    name: r.name,
    country: r.country ?? '',
    admin1: r.admin1,
    latitude: r.latitude,
    longitude: r.longitude,
  }
}

export async function getWeather(query: string): Promise<WeatherResult | null> {
  const place = await geocodeCity(query)
  if (!place) return null

  const params = new URLSearchParams({
    latitude: String(place.latitude),
    longitude: String(place.longitude),
    current: 'temperature_2m,relative_humidity_2m,is_day,weather_code,wind_speed_10m',
    daily: 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max',
    timezone: 'auto',
    forecast_days: '7',
  })
  const res = await fetch(`${FORECAST}?${params.toString()}`)
  if (!res.ok) throw new Error('Forecast failed')
  const data = await res.json()

  return {
    place,
    current: {
      temp: Math.round(data.current.temperature_2m),
      weatherCode: data.current.weather_code,
      windSpeed: Math.round(data.current.wind_speed_10m),
      humidity: data.current.relative_humidity_2m,
      isDay: data.current.is_day === 1,
    },
    daily: (data.daily.time as string[]).map((date, i) => ({
      date,
      weatherCode: data.daily.weather_code[i],
      tempMax: Math.round(data.daily.temperature_2m_max[i]),
      tempMin: Math.round(data.daily.temperature_2m_min[i]),
      rainProb: data.daily.precipitation_probability_max?.[i] ?? 0,
    })),
  }
}

/** Map a WMO weather code to a label + emoji + travel advice. */
export function describeWeather(code: number): { label: string; emoji: string } {
  if (code === 0) return { label: 'Clear sky', emoji: '☀️' }
  if (code <= 2) return { label: 'Partly cloudy', emoji: '⛅' }
  if (code === 3) return { label: 'Overcast', emoji: '☁️' }
  if (code <= 48) return { label: 'Foggy', emoji: '🌫️' }
  if (code <= 57) return { label: 'Drizzle', emoji: '🌦️' }
  if (code <= 67) return { label: 'Rain', emoji: '🌧️' }
  if (code <= 77) return { label: 'Snow', emoji: '❄️' }
  if (code <= 82) return { label: 'Rain showers', emoji: '🌧️' }
  if (code <= 86) return { label: 'Snow showers', emoji: '🌨️' }
  return { label: 'Thunderstorm', emoji: '⛈️' }
}

export function travelAdvice(w: WeatherResult): string {
  const maxRain = Math.max(...w.daily.map((d) => d.rainProb))
  const hot = w.current.temp >= 32
  const cold = w.current.temp <= 8
  if (maxRain >= 60) return 'Pack a rain jacket and a compact umbrella — showers are likely this week.'
  if (hot) return 'It’s hot — light breathable clothing, sunscreen, and plenty of water are a must.'
  if (cold) return 'Bundle up — warm layers, a jacket, and gloves will keep you comfortable.'
  return 'Pleasant conditions ahead — comfortable everyday clothing should be perfect.'
}
