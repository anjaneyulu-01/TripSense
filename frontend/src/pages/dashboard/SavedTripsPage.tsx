import { useTrips } from '@/lib/tripStore'
import { TripGrid } from '@/pages/dashboard/TripsPage'

export default function SavedTripsPage() {
  const trips = useTrips()
  return (
    <TripGrid
      trips={trips}
      favoritesOnly
      title="Saved Trips"
      subtitle="Your favorited trips, ready to revisit."
    />
  )
}
