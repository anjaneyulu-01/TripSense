import { Link } from 'react-router-dom'
import { Sparkles, Hammer } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export default function ComingSoonPage({ title }: { title: string }) {
  return (
    <div className="mx-auto max-w-xl">
      <Card className="flex flex-col items-center gap-4 p-12 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 text-primary">
          <Hammer className="h-8 w-8" />
        </span>
        <h1 className="text-2xl font-bold text-foreground">{title}</h1>
        <p className="max-w-sm text-muted">
          This module is on the roadmap. The AI consultant is fully live today —
          start there and this section will fill with your trip data.
        </p>
        <Link to="/app/consultant" className="mt-2">
          <Button>
            <Sparkles className="h-4 w-4" /> Use the AI Consultant
          </Button>
        </Link>
      </Card>
    </div>
  )
}
