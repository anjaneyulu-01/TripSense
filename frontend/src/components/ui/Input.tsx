import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    const inputId = id ?? props.name
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="mb-1.5 block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full rounded-[var(--radius-md)] border border-input bg-surface px-3.5 py-2.5 text-sm',
              'text-foreground placeholder:text-muted/70 transition-colors',
              'focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/40',
              icon && 'pl-10',
              error && 'border-danger focus:border-danger focus:ring-danger/30',
              className,
            )}
            aria-invalid={Boolean(error)}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
      </div>
    )
  },
)
Input.displayName = 'Input'
