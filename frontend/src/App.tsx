import { lazy, Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { DashboardLayout } from '@/components/layout/DashboardLayout'
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute'
import { FullPageSpinner } from '@/components/ui/Spinner'

// Route-level code splitting keeps the initial bundle small.
const LandingPage = lazy(() => import('@/pages/LandingPage'))
const LoginPage = lazy(() => import('@/pages/auth/LoginPage'))
const RegisterPage = lazy(() => import('@/pages/auth/RegisterPage'))
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage'))
const ConsultantPage = lazy(() => import('@/pages/dashboard/ConsultantPage'))
const BudgetPage = lazy(() => import('@/pages/dashboard/BudgetPage'))
const PackingPage = lazy(() => import('@/pages/dashboard/PackingPage'))
const WeatherPage = lazy(() => import('@/pages/dashboard/WeatherPage'))
const TripsPage = lazy(() => import('@/pages/dashboard/TripsPage'))
const SavedTripsPage = lazy(() => import('@/pages/dashboard/SavedTripsPage'))
const AnalyticsPage = lazy(() => import('@/pages/dashboard/AnalyticsPage'))
const SettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'))
const NotFoundPage = lazy(() => import('@/pages/NotFoundPage'))

export default function App() {
  return (
    <Suspense fallback={<FullPageSpinner />}>
      <Routes>
        <Route path="/" element={<LandingPage />} />

        {/* Auth (only for signed-out users) */}
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>

        {/* Protected dashboard */}
        <Route element={<ProtectedRoute />}>
          <Route path="/app" element={<DashboardLayout />}>
            <Route index element={<DashboardPage />} />
            <Route path="consultant" element={<ConsultantPage />} />
            <Route path="budget" element={<BudgetPage />} />
            <Route path="packing" element={<PackingPage />} />
            <Route path="weather" element={<WeatherPage />} />
            <Route path="trips" element={<TripsPage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="saved" element={<SavedTripsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  )
}
