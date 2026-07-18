import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Tone = 'primary' | 'accent' | 'success' | 'warning' | 'muted'

const tones: Record<Tone, string> = {
  primary: 'bg-primary/12 text-primary',
  accent: 'bg-accent/12 text-accent',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  muted: 'bg-surface-2 text-muted',
}

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone
}

export function Badge({ className, tone = 'primary', ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium',
        tones[tone],
        className,
      )}
      {...props}
    />
  )
}
