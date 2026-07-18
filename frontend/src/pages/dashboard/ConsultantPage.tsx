import { useRef, useState, useEffect, type FormEvent } from 'react'
import { useMutation } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react'
import { consultApi } from '@/api/consult'
import { getErrorMessage } from '@/api/client'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CollectedInfoPanel } from '@/components/consultant/CollectedInfoPanel'
import { useAuth } from '@/contexts/AuthContext'
import { useSpeech } from '@/hooks/useSpeech'
import { tripStore } from '@/lib/tripStore'
import { cn } from '@/lib/utils'
import type { ChatMessage, CollectedInfo, ConsultResponse, Language } from '@/types'

const LANGUAGES: { value: Language; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'hi', label: 'हिन्दी' },
  { value: 'te', label: 'తెలుగు' },
]

const STARTERS = [
  'Plan a 5-day beach trip from Hyderabad under ₹50,000',
  'Weekend getaway near Bangalore for a couple',
  'Family trip to the mountains with kids in December',
  'Budget backpacking route across Rajasthan for 10 days',
]

let idCounter = 0
const nextId = () => `m-${Date.now()}-${idCounter++}`

export default function ConsultantPage() {
  const { user } = useAuth()
  const firstName = user?.full_name.split(' ')[0] ?? 'traveler'

  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [language, setLanguage] = useState<Language>('en')
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [collected, setCollected] = useState<CollectedInfo | null>(null)
  const [readyToPlan, setReadyToPlan] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [voiceOn, setVoiceOn] = useState(true)
  const [saved, setSaved] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  const speech = useSpeech(language)

  const mutation = useMutation({
    mutationFn: consultApi.send,
    onSuccess: (res: ConsultResponse) => {
      setConversationId(res.conversation_id)
      setCollected(res.collected_info)
      setReadyToPlan(res.ready_to_plan)
      setMessages((prev) => [
        ...prev.filter((m) => !m.pending),
        { id: nextId(), role: 'assistant', content: res.reply, provider: res.provider },
      ])
      // Speak the reply aloud when voice output is enabled.
      if (voiceOn) speech.speak(res.reply)
    },
    onError: (err) => {
      setMessages((prev) => prev.filter((m) => !m.pending))
      setError(getErrorMessage(err, 'The consultant is unavailable right now.'))
    },
  })

  const toggleMic = () => {
    if (speech.listening) {
      speech.stopListening()
      return
    }
    speech.stopSpeaking()
    speech.startListening((text) => {
      // Auto-send what was dictated.
      if (text) send(text)
    })
  }

  const toggleVoice = () => {
    if (voiceOn) speech.stopSpeaking()
    setVoiceOn((v) => !v)
  }

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const send = (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || mutation.isPending) return
    setError(null)
    setSaved(false)
    setMessages((prev) => [
      ...prev,
      { id: nextId(), role: 'user', content: trimmed },
      { id: nextId(), role: 'assistant', content: '', pending: true },
    ])
    setInput('')
    mutation.mutate({ message: trimmed, conversation_id: conversationId, language })
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    send(input)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="w-full">
      {/* Hero AI card */}
      <div className="flex h-[calc(100vh-9.5rem)] flex-col overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-soft)]">
        {/* Signature gradient top strip */}
        <div className="brand-strip h-1.5 w-full shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl brand-gradient text-white shadow-[var(--shadow-glow)]">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h1 className="font-bold">
                <span className="text-gradient">TripSense AI</span>
              </h1>
              <p className="text-xs text-muted">Your intelligent travel consultant</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {speech.ttsSupported && (
              <button
                onClick={toggleVoice}
                className={cn(
                  'pill border transition-colors',
                  voiceOn
                    ? 'border-primary/30 bg-primary/10 text-primary'
                    : 'border-border bg-surface text-muted',
                )}
                title={voiceOn ? 'Voice replies on' : 'Voice replies off'}
              >
                {voiceOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                Voice
              </button>
            )}
            <span className="pill hidden bg-success/12 text-success sm:inline-flex">
              <span className="h-2 w-2 rounded-full bg-success" /> Online
            </span>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="rounded-full border border-input bg-surface-2 px-3 py-1.5 text-sm text-foreground focus:border-primary focus:outline-none"
              aria-label="Language"
            >
              {LANGUAGES.map((l) => (
                <option key={l.value} value={l.value}>{l.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Trip details inside chatbox banner */}
        <div className="border-b border-border bg-surface-2/40 px-5 py-3 text-xs">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-foreground">Trip Details</span>
              <span className="rounded bg-primary/10 px-1.5 py-0.5 font-bold text-primary">
                {collected ? Math.round((['budget', 'duration_days', 'starting_city', 'travel_type', 'interests'].filter(k => collected[k as keyof CollectedInfo] !== null && collected[k as keyof CollectedInfo] !== undefined && collected[k as keyof CollectedInfo] !== '').length / 5) * 100) : 0}% Complete
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-muted">
              <span>💰 Budget: <strong className="text-foreground">{collected?.budget ? `${collected.currency ?? 'INR'} ${collected.budget.toLocaleString()}` : '—'}</strong></span>
              <span>📅 Duration: <strong className="text-foreground">{collected?.duration_days ? `${collected.duration_days} days` : '—'}</strong></span>
              <span>📍 From: <strong className="text-foreground">{collected?.starting_city ?? '—'}</strong></span>
              <span>✈️ Destination: <strong className="text-foreground">{collected?.destination ?? '—'}</strong></span>
              <span>👥 Type: <strong className="text-foreground">{collected?.travel_type ?? '—'}</strong></span>
            </div>
          </div>
        </div>

        {/* Messages / empty state */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5">
          {isEmpty ? (
            <EmptyState name={firstName} onPick={send} />
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <MessageBubble key={m.id} message={m} />
              ))}
            </AnimatePresence>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-danger/10 px-4 py-3 text-sm text-danger">
              <AlertCircle className="h-4 w-4 shrink-0" /> {error}
            </div>
          )}
        </div>

        {/* Composer */}
        <form onSubmit={onSubmit} className="border-t border-border p-4">
          {readyToPlan && (
            <div className="mb-3 flex flex-wrap items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4" /> Enough details collected!
              </span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={saved}
                onClick={() => {
                  if (!collected) return
                  const lastAssistant = [...messages].reverse().find((m) => m.role === 'assistant' && !m.pending)
                  tripStore.add(collected, lastAssistant?.content ?? '')
                  setSaved(true)
                }}
              >
                {saved ? 'Saved to My Trips ✓' : 'Save this trip'}
              </Button>
            </div>
          )}
          <div className="flex items-end gap-2">
            {speech.sttSupported && (
              <Button
                type="button"
                size="icon"
                variant={speech.listening ? 'primary' : 'outline'}
                onClick={toggleMic}
                aria-label={speech.listening ? 'Stop listening' : 'Speak your message'}
                className={cn('shrink-0 rounded-full', speech.listening && 'animate-pulse')}
              >
                {speech.listening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
              </Button>
            )}
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  send(input)
                }
              }}
              rows={1}
              placeholder={speech.listening ? 'Listening… speak now' : 'Type a prompt and press send…'}
              className="max-h-32 flex-1 resize-none rounded-full border border-input bg-surface-2 px-5 py-3 text-sm text-foreground placeholder:text-muted/70 focus:border-primary focus:outline-none focus:ring-2 focus:ring-ring/30"
            />
            <Button type="submit" className="rounded-full px-6" isLoading={mutation.isPending}>
              {!mutation.isPending && <Send className="h-4 w-4" />} Send
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
    >
      <span
        className={cn(
          'grid h-8 w-8 shrink-0 place-items-center rounded-lg text-xs font-semibold',
          isUser ? 'bg-surface-2 text-foreground' : 'brand-gradient text-white',
        )}
      >
        {isUser ? 'You' : <Sparkles className="h-4 w-4" />}
      </span>
      <div className={cn('max-w-[85%] space-y-1', isUser && 'items-end text-right')}>
        <div
          className={cn(
            'inline-block whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm',
            isUser
              ? 'rounded-tr-sm bg-primary text-primary-foreground'
              : 'rounded-tl-sm bg-surface-2 text-foreground',
          )}
        >
          {message.pending ? <TypingDots /> : message.content}
        </div>
      </div>
    </motion.div>
  )
}

function TypingDots() {
  return (
    <span className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-2 w-2 rounded-full bg-muted"
          animate={{ opacity: [0.3, 1, 0.3] }}
          transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
        />
      ))}
    </span>
  )
}

function EmptyState({ name, onPick }: { name: string; onPick: (text: string) => void }) {
  return (
    <div className="flex h-full flex-col items-center justify-center px-6 text-center">
      <motion.span
        className="grid h-16 w-16 place-items-center rounded-2xl brand-gradient text-white shadow-[var(--shadow-glow)]"
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ duration: 2.5, repeat: Infinity }}
      >
        <Sparkles className="h-8 w-8" />
      </motion.span>
      <h2 className="mt-5 text-3xl font-extrabold tracking-tight">
        <span className="text-gradient">Hey {name}!</span>
      </h2>
      <p className="mt-2 max-w-md text-muted">
        I'm your intelligent travel consultant. Tell me about your trip and I'll
        ask only what I still need — then build your plan.
      </p>
      <div className="mt-7 grid w-full max-w-2xl gap-3 sm:grid-cols-2">
        {STARTERS.map((s) => (
          <button
            key={s}
            onClick={() => onPick(s)}
            className="group flex items-start gap-2 rounded-[var(--radius-md)] border border-border bg-surface p-4 text-left text-sm text-foreground transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
          >
            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary transition-transform group-hover:translate-x-0.5" />
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
