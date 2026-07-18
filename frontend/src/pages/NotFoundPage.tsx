import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '@/components/ui/Button'

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background bg-mesh px-6 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary to-accent text-white">
        <Compass className="h-8 w-8" />
      </span>
      <h1 className="mt-6 text-5xl font-extrabold text-foreground">404</h1>
      <p className="mt-2 max-w-sm text-muted">
        This route wandered off the map. Let's get you back on track.
      </p>
      <Link to="/" className="mt-6">
        <Button size="lg">Back to home</Button>
      </Link>
    </div>
  )
}
