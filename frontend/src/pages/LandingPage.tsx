import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Sparkles,
  Wallet,
  Luggage,
  Map,
  Globe2,
  ShieldCheck,
  ArrowRight,
  Mic,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/api/client'

const features = [
  {
    icon: Sparkles,
    title: 'AI Travel Consultant',
    desc: 'A multilingual consultant that remembers context and asks only what it needs.',
  },
  {
    icon: Map,
    title: 'Day-wise Itineraries',
    desc: 'Morning-to-night plans with timings, food stops, and travel tips.',
  },
  {
    icon: Wallet,
    title: 'Smart Budget Engine',
    desc: 'Transparent breakdowns with savings suggestions and optimization.',
  },
  {
    icon: Luggage,
    title: 'Personalized Packing',
    desc: 'Lists tailored to weather, activities, and who you travel with.',
  },
  {
    icon: Globe2,
    title: 'English · Hindi · Telugu',
    desc: 'Plan in your language. Built to add more with zero rework.',
  },
  {
    icon: ShieldCheck,
    title: 'Reliable by design',
    desc: 'Seamless AI failover means the consultant is always available.',
  },
]

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
}

export default function LandingPage() {
  const { continueAsGuest } = useAuth()
  const navigate = useNavigate()
  const [guestLoading, setGuestLoading] = useState(false)
  const [guestError, setGuestError] = useState<string | null>(null)

  const startAsGuest = async () => {
    setGuestError(null)
    setGuestLoading(true)
    try {
      await continueAsGuest()
      navigate('/app/consultant')
    } catch (err) {
      setGuestError(getErrorMessage(err, 'Could not start a guest session.'))
      setGuestLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <header className="sticky top-0 z-30 border-b border-border/60 glass">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 lg:px-8">
          <Logo />
          <nav className="hidden items-center gap-7 text-sm font-medium text-muted md:flex">
            <a href="#features" className="hover:text-foreground">Features</a>
            <a href="#how" className="hover:text-foreground">How it works</a>
            <a href="#pricing" className="hover:text-foreground">Pricing</a>
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link to="/login" className="hidden sm:block">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-mesh py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 lg:px-8">
          <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
            {/* Left Column (Text & Action buttons) */}
            <div className="text-center lg:col-span-7 lg:text-left">
              <motion.div initial="hidden" animate="show" variants={fadeUp} transition={{ duration: 0.5 }}>
                <Badge tone="primary" className="mx-auto mb-6 lg:mx-0">
                  <Sparkles className="h-3.5 w-3.5" /> Multilingual AI travel planning
                </Badge>
              </motion.div>
              <motion.h1
                initial="hidden"
                animate="show"
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.05 }}
                className="text-4xl font-extrabold leading-tight tracking-tight text-foreground sm:text-6xl"
              >
                Travel Smarter with <span className="text-gradient">TripSense</span>
              </motion.h1>
              <motion.p
                initial="hidden"
                animate="show"
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="mt-6 text-lg text-muted max-w-2xl mx-auto lg:mx-0"
              >
                Plan your perfect journey using an intelligent multilingual AI travel
                consultant — destinations, itineraries, budgets, and packing, all in one place.
              </motion.p>
              <motion.div
                initial="hidden"
                animate="show"
                variants={fadeUp}
                transition={{ duration: 0.5, delay: 0.15 }}
                className="mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row lg:justify-start"
              >
                <Button
                  size="lg"
                  className="w-full sm:w-auto"
                  onClick={startAsGuest}
                  isLoading={guestLoading}
                >
                  Start Planning <ArrowRight className="h-4 w-4" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto"
                  onClick={startAsGuest}
                  isLoading={guestLoading}
                >
                  <Mic className="h-4 w-4" /> Try AI Consultant
                </Button>
              </motion.div>
              {guestError && (
                <p className="mt-4 text-sm text-danger text-center lg:text-left">{guestError}</p>
              )}
              <p className="mt-4 text-xs text-muted">
                No account needed — jump in as a guest. You can save your work later.
              </p>
            </div>

            {/* Right Column (Premium Visual Travel Image & Overlay Dialog) */}
            <div className="lg:col-span-5 relative mt-8 lg:mt-0">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative mx-auto max-w-md lg:max-w-none"
              >
                {/* Background mesh/glow effects */}
                <div className="absolute -inset-2 rounded-3xl bg-gradient-to-tr from-primary/30 to-accent/30 opacity-40 blur-2xl" />
                
                {/* Image Container with Zoom effect */}
                <div className="relative overflow-hidden rounded-3xl border border-border/80 shadow-2xl aspect-[4/3] bg-surface-1">
                  <img
                    src="/hero_travel.png"
                    alt="Travel destination view"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
                </div>

                {/* Overlapping Floating AI conversation widget */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.35 }}
                  className="absolute -bottom-8 -left-4 right-4 sm:-left-8 sm:right-8"
                >
                  <Card glass className="p-4 shadow-xl border-border/40 backdrop-blur-md">
                    <div className="flex items-start gap-3">
                      <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gradient-to-br from-primary to-accent text-white">
                        <Sparkles className="h-4 w-4" />
                      </span>
                      <div className="space-y-2 flex-grow">
                        <p className="rounded-xl rounded-tl-none bg-surface-2 px-3.5 py-1.5 text-xs text-foreground/90 font-medium">
                          5 days, ₹50,000, leaving from Hyderabad — beaches & food.
                        </p>
                        <p className="rounded-xl rounded-tl-none bg-primary/10 px-3.5 py-1.5 text-xs text-foreground font-medium border border-primary/10">
                          Perfect — Goa fits your budget. Here's a 5-day plan with beach mornings and hidden sunset points…
                        </p>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            Everything you need to plan the perfect trip
          </h2>
          <p className="mt-4 text-muted">
            One premium platform. The AI is a feature — not a chatbot.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.05 }}
            >
              <Card className="h-full p-6 transition-transform hover:-translate-y-1">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-foreground">{title}</h3>
                <p className="mt-2 text-sm text-muted">{desc}</p>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section id="pricing" className="mx-auto max-w-7xl px-4 pb-24 lg:px-8">
        <Card className="overflow-hidden bg-gradient-to-br from-primary to-accent p-10 text-center text-white lg:p-16">
          <h2 className="text-3xl font-bold sm:text-4xl">Ready to plan your next trip?</h2>
          <p className="mx-auto mt-3 max-w-xl text-white/90">
            Create a free account and let TripSense do the heavy lifting.
          </p>
          <Link to="/register" className="mt-8 inline-block">
            <Button size="lg" variant="secondary" className="bg-white text-primary hover:bg-white/90">
              Get started free <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </Card>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted lg:flex-row lg:px-8">
          <Logo />
          <p>© {new Date().getFullYear()} TripSense. Plan smarter, travel better.</p>
        </div>
      </footer>
    </div>
  )
}
