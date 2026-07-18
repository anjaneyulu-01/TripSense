import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { Mail, Lock, User, AlertCircle } from 'lucide-react'
import { AuthShell } from '@/pages/auth/AuthShell'
import { Input } from '@/components/ui/Input'
import { Button } from '@/components/ui/Button'
import { useAuth } from '@/contexts/AuthContext'
import { getErrorMessage } from '@/api/client'

interface FormValues {
  full_name: string
  email: string
  password: string
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth()
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>()

  const onSubmit = async (values: FormValues) => {
    setServerError(null)
    try {
      await registerUser(values)
      navigate('/app', { replace: true })
    } catch (err) {
      setServerError(getErrorMessage(err, 'Unable to create account.'))
    }
  }

  return (
    <AuthShell
      title="Create your account"
      subtitle="Start planning smarter trips in minutes."
      footer={
        <>
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Sign in
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
          label="Full name"
          placeholder="Ada Lovelace"
          icon={<User className="h-4 w-4" />}
          error={errors.full_name?.message}
          {...register('full_name', {
            required: 'Full name is required',
            minLength: { value: 2, message: 'That name looks too short' },
          })}
        />
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
          placeholder="At least 8 characters"
          icon={<Lock className="h-4 w-4" />}
          error={errors.password?.message}
          {...register('password', {
            required: 'Password is required',
            minLength: { value: 8, message: 'Use at least 8 characters' },
          })}
        />
        <Button type="submit" size="lg" className="w-full" isLoading={isSubmitting}>
          Create account
        </Button>
      </form>
    </AuthShell>
  )
}
