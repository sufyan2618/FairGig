import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Login } from './pages/Login.tsx'
import { Signup } from './pages/Signup.tsx'
import AdvocateDashboardPage from './pages/advocate/DashboardPage.tsx'
import CommissionRateTrackerPage from './pages/advocate/CommissionRateTrackerPage.tsx'
import ComplaintAnalyticsPage from './pages/advocate/ComplaintAnalyticsPage.tsx'
import GrievanceModerationPage from './pages/advocate/GrievanceModerationPage.tsx'
import IncomeDistributionMapPage from './pages/advocate/IncomeDistributionMapPage.tsx'
import AdvocateProfileSettingsPage from './pages/advocate/ProfileSettingsPage.tsx'
import VulnerabilityFlagsPage from './pages/advocate/VulnerabilityFlagsPage.tsx'
import LogShiftPage from './pages/worker/LogShiftPage.tsx'
import MyEarningsPage from './pages/worker/MyEarningsPage.tsx'
import MyAnalyticsPage from './pages/worker/MyAnalyticsPage.tsx'
import IncomeCertificatePage from './pages/worker/IncomeCertificatePage.tsx'
import GrievanceBoardPage from './pages/worker/GrievanceBoardPage.tsx'
import ProfileSettingsPage from './pages/worker/ProfileSettingsPage.tsx'
import UploadScreenshotPage from './pages/worker/UploadScreenshotPage.tsx'
import { useEffect, useState, type ReactNode } from 'react'

interface ToastState {
  message: string
  tone?: 'error' | 'success'
}

const getIsAuthenticated = () => localStorage.getItem('mailflow_auth') === 'true'

const RouteToast = () => {
  const location = useLocation()
  const navigate = useNavigate()
  const [toast, setToast] = useState<ToastState | null>(null)

  useEffect(() => {
    const state = location.state as { toast?: ToastState } | null

    if (!state?.toast) {
      return
    }

    if (state.toast.message === 'Please sign in first.' && getIsAuthenticated()) {
      navigate(location.pathname, { replace: true, state: {} })
      return
    }

    setToast(state.toast)
    navigate(location.pathname, { replace: true, state: {} })

    const timeout = window.setTimeout(() => setToast(null), 2800)
    return () => window.clearTimeout(timeout)
  }, [location, navigate])

  if (!toast) {
    return null
  }

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-60">
      <div
        className={
          toast.tone === 'success'
            ? 'rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 shadow-lg'
            : 'rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-800 shadow-lg'
        }
      >
        {toast.message}
      </div>
    </div>
  )
}

interface ProtectedRouteProps {
  children: ReactNode
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  if (!getIsAuthenticated()) {
    return <Navigate to="/login" replace state={{ toast: { message: 'Please sign in first.', tone: 'error' } }} />
  }

  return <>{children}</>
}

const FallbackRedirect = () => {
  if (!getIsAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  return (
    <Navigate
      to="/dashboard"
      replace
      state={{
        toast: {
          message: 'Page not found. Redirected to dashboard.',
          tone: 'error',
        },
      }}
    />
  )
}

const AppRoutes = () => (
  <>
    <RouteToast />
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      <Route
        path="/advocate/dashboard"
        element={
          <ProtectedRoute>
            <AdvocateDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/commission-tracker"
        element={
          <ProtectedRoute>
            <CommissionRateTrackerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/complaint-analytics"
        element={
          <ProtectedRoute>
            <ComplaintAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/grievance-board"
        element={
          <ProtectedRoute>
            <GrievanceModerationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/income-distribution-map"
        element={
          <ProtectedRoute>
            <IncomeDistributionMapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/vulnerability-flags"
        element={
          <ProtectedRoute>
            <VulnerabilityFlagsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/profile-settings"
        element={
          <ProtectedRoute>
            <AdvocateProfileSettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <App />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/log-shift"
        element={
          <ProtectedRoute>
            <LogShiftPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/my-earnings"
        element={
          <ProtectedRoute>
            <MyEarningsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/my-analytics"
        element={
          <ProtectedRoute>
            <MyAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/income-certificate"
        element={
          <ProtectedRoute>
            <IncomeCertificatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/grievance-board"
        element={
          <ProtectedRoute>
            <GrievanceBoardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/profile-settings"
        element={
          <ProtectedRoute>
            <ProfileSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/upload-screenshot"
        element={
          <ProtectedRoute>
            <UploadScreenshotPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/upload-screenshots"
        element={
          <ProtectedRoute>
            <UploadScreenshotPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/greivance-board"
        element={
          <ProtectedRoute>
            <GrievanceBoardPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<FallbackRedirect />} />
    </Routes>
  </>
)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </StrictMode>,
)
