import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'

interface AuthShellProps {
  title: string
  subtitle: string
  children: ReactNode
  footer: ReactNode
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* Brand panel */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary to-accent lg:block">
        <div className="bg-mesh absolute inset-0 opacity-40" />
        <div className="relative flex h-full flex-col justify-between p-12 text-white">
          <Logo className="[&_span]:text-white [&_.text-gradient]:text-white" />
          <div>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="max-w-md text-4xl font-bold leading-tight"
            >
              Your intelligent travel consultant, in any language.
            </motion.h2>
            <p className="mt-4 max-w-md text-white/85">
              Destinations, day-wise itineraries, budgets, and packing lists —
              planned around you.
            </p>
          </div>
          <p className="text-sm text-white/70">
            © {new Date().getFullYear()} TripSense
          </p>
        </div>
      </div>

      {/* Form panel */}
      <div className="flex flex-col bg-background">
        <div className="flex items-center justify-between p-6">
          <Link to="/" className="lg:invisible">
            <Logo />
          </Link>
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-12">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm"
          >
            <h1 className="text-2xl font-bold text-foreground">{title}</h1>
            <p className="mt-1.5 text-sm text-muted">{subtitle}</p>
            <div className="mt-8">{children}</div>
            <div className="mt-6 text-center text-sm text-muted">{footer}</div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
