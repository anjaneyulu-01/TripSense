import { Compass } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Logo({ className, showText = true }: { className?: string; showText?: boolean }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent text-white shadow-[var(--shadow-glow)]">
        <Compass className="h-5 w-5" />
      </div>
      {showText && (
        <span className="text-lg font-bold tracking-tight text-foreground">
          Trip<span className="text-gradient">Sense</span>
        </span>
      )}
    </div>
  )
}
