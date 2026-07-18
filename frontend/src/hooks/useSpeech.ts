import { useCallback, useEffect, useRef, useState } from 'react'
import type { Language } from '@/types'

/**
 * Voice input/output via the browser's Web Speech API — no API keys needed.
 * - Speech-to-text (mic) for dictating messages
 * - Text-to-speech so the consultant can speak its replies aloud
 * Gracefully reports `supported: false` where the API is unavailable.
 */

const BCP47: Record<Language, string> = {
  en: 'en-US',
  hi: 'hi-IN',
  te: 'te-IN',
}

// Minimal typings for the non-standard SpeechRecognition API.
interface SpeechRecognitionLike {
  lang: string
  continuous: boolean
  interimResults: boolean
  start: () => void
  stop: () => void
  onresult: ((e: SpeechRecognitionResultEvent) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
}
interface SpeechRecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}
type SRConstructor = new () => SpeechRecognitionLike

function getRecognition(): SRConstructor | null {
  const w = window as unknown as {
    SpeechRecognition?: SRConstructor
    webkitSpeechRecognition?: SRConstructor
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function useSpeech(language: Language) {
  const [listening, setListening] = useState(false)
  const [speaking, setSpeaking] = useState(false)
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)

  const sttSupported = typeof window !== 'undefined' && getRecognition() !== null
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop()
    setListening(false)
  }, [])

  const startListening = useCallback(
    (onResult: (text: string) => void) => {
      const SR = getRecognition()
      if (!SR) return
      const rec = new SR()
      rec.lang = BCP47[language]
      rec.continuous = false
      rec.interimResults = false
      rec.onresult = (e) => {
        const text = Array.from({ length: e.results.length })
          .map((_, i) => e.results[i][0].transcript)
          .join(' ')
        onResult(text.trim())
      }
      rec.onerror = () => setListening(false)
      rec.onend = () => setListening(false)
      recognitionRef.current = rec
      setListening(true)
      rec.start()
    },
    [language],
  )

  const speak = useCallback(
    (text: string) => {
      if (!ttsSupported || !text) return
      window.speechSynthesis.cancel()
      const utter = new SpeechSynthesisUtterance(text)
      utter.lang = BCP47[language]
      utter.rate = 1.02
      utter.pitch = 1
      utter.onstart = () => setSpeaking(true)
      utter.onend = () => setSpeaking(false)
      utter.onerror = () => setSpeaking(false)
      window.speechSynthesis.speak(utter)
    },
    [language, ttsSupported],
  )

  const stopSpeaking = useCallback(() => {
    if (ttsSupported) window.speechSynthesis.cancel()
    setSpeaking(false)
  }, [ttsSupported])

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  return {
    sttSupported,
    ttsSupported,
    listening,
    speaking,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
  }
}
