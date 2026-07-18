import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock, AlertCircle } from 'lucide-react'
import { AuthShell } from '@/pages/auth/AuthShell'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/api/client'

interface FormValues {
  email: string
  password: string
}

export default function LoginPage() {
  const { login, continueAsGuest } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [serverError, setServerError] = useState<string | null>(null)
  const [guestLoading, setGuestLoading] = useState(false)

  const handleGuest = async () => {
    setServerError(null)
    setGuestLoading(true)
    try {
      await continueAsGuest()
      navigate('/app/consultant', { replace: true })
    } catch (err) {
      setServerError(getErrorMessage(err, 'Could not start a guest session.'))
      setGuestLoading(false)
    }
  }

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      await login(values)
      const to = (location.state as { from?: string })?.from ?? '/app'
      navigate(to, { replace: true })
    } catch (err) {
      setServerError(getErrorMessage(err, 'Unable to sign in.'))
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue planning your trips."
      footer={
        <>
          Don't have an account?{' '}
          <Link to="/register" className="font-semibold text-primary hover:underline">
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        {serverError && (
          <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-danger/10 px-3.5 py-2.5 text-sm text-danger">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {serverError}
          </div>
        )}
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          icon={<Mail className="h-4 w-4" />}
          error={errors.email?.message}
          {...register('email', {
            required: 'Email is required',
            pattern: { value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: 'Enter a valid email' },
          })}
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          {...register('password', { required: 'Password is required' })}
        />
        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
          Sign in
        </Button>

        <div className="flex items-center gap-3 py-1 text-xs text-muted">
          <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          size="lg"
          variant="outline"
          className="w-full"
          onClick={handleGuest}
          isLoading={guestLoading}
        >
          Continue as guest
        </Button>
      </form>
    </AuthShell>
  )
}
