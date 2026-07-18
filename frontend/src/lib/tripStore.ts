import { useSyncExternalStore } from 'react'
import type { CollectedInfo } from '@/types'

/**
 * Lightweight client-side trip store (localStorage), reactive across pages via
 * useSyncExternalStore. This lets My Trips / Saved Trips / Analytics work today
 * without backend persistence; it can later be swapped for API calls behind the
 * same hook surface.
 */

export interface SavedTrip {
  id: string
  title: string
  createdAt: number
  favorite: boolean
  collected: CollectedInfo
  summary: string
}

const KEY = 'tripsense.trips'
const listeners = new Set<() => void>()

let cachedTrips: SavedTrip[] | null = null

function read(): SavedTrip[] {
  if (cachedTrips !== null) return cachedTrips
  try {
    cachedTrips = JSON.parse(localStorage.getItem(KEY) ?? '[]') as SavedTrip[]
  } catch {
    cachedTrips = []
  }
  return cachedTrips
}

function write(trips: SavedTrip[]): void {
  localStorage.setItem(KEY, JSON.stringify(trips))
  cachedTrips = trips
  listeners.forEach((l) => l())
}

function subscribe(cb: () => void): () => void {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export const tripStore = {
  all: read,
  add(collected: CollectedInfo, summary: string): SavedTrip {
    const trip: SavedTrip = {
      id: crypto.randomUUID(),
      title:
        collected.destination
          ? `Trip to ${collected.destination}`
          : collected.starting_city
            ? `Trip from ${collected.starting_city}`
            : 'New trip',
      createdAt: Date.now(),
      favorite: false,
      collected,
      summary,
    }
    write([trip, ...read()])
    return trip
  },
  remove(id: string): void {
    write(read().filter((t) => t.id !== id))
  },
  rename(id: string, title: string): void {
    write(read().map((t) => (t.id === id ? { ...t, title } : t)))
  },
  toggleFavorite(id: string): void {
    write(read().map((t) => (t.id === id ? { ...t, favorite: !t.favorite } : t)))
  },
  duplicate(id: string): void {
    const t = read().find((x) => x.id === id)
    if (!t) return
    write([{ ...t, id: crypto.randomUUID(), title: `${t.title} (copy)`, createdAt: Date.now() }, ...read()])
  },
}

/** Reactive hook — re-renders any component when trips change. */
export function useTrips(): SavedTrip[] {
  return useSyncExternalStore(subscribe, read, read)
}
