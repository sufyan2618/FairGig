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
import VerifierDashboardPage from './pages/verifier/DashboardPage.tsx'
import VerificationQueuePage from './pages/verifier/VerificationQueuePage.tsx'
import VerificationReviewPage from './pages/verifier/VerificationReviewPage.tsx'
import VerifiedHistoryPage from './pages/verifier/VerifiedHistoryPage.tsx'
import VerifierProfileSettingsPage from './pages/verifier/ProfileSettingsPage.tsx'  
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

type UserRole = 'worker' | 'advocate' | 'verifier'

interface ToastState {
  message: string
  tone?: 'error' | 'success'
}

const getIsAuthenticated = () => localStorage.getItem('mailflow_auth') === 'true'

const getUserRole = (): UserRole => {
  const role = localStorage.getItem('mailflow_role')

  if (role === 'advocate') {
    return 'advocate'
  }

  if (role === 'verifier') {
    return 'verifier'
  }

  return 'worker'
}

const getHomeRouteForRole = (role: UserRole): string => {
  if (role === 'advocate') {
    return '/advocate/dashboard'
  }

  if (role === 'verifier') {
    return '/verifier/dashboard'
  }

  return '/dashboard'
}

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
  allowedRole: UserRole
  children: ReactNode
}

const ProtectedRoute = ({ allowedRole, children }: ProtectedRouteProps) => {
  void allowedRole

  if (!getIsAuthenticated()) {
    return <Navigate to="/login" replace state={{ toast: { message: 'Please sign in first.', tone: 'error' } }} />
  }

  return <>{children}</>
}

const FallbackRedirect = () => {
  if (!getIsAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  const role = getUserRole()

  return (
    <Navigate
      to={getHomeRouteForRole(role)}
      replace
      state={{
        toast: {
          message: 'Page not found or access denied. Redirected to your dashboard.',
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
          <ProtectedRoute allowedRole="advocate">
            <AdvocateDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/commission-tracker"
        element={
          <ProtectedRoute allowedRole="advocate">
            <CommissionRateTrackerPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/complaint-analytics"
        element={
          <ProtectedRoute allowedRole="advocate">
            <ComplaintAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/grievance-board"
        element={
          <ProtectedRoute allowedRole="advocate">
            <GrievanceModerationPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/income-distribution-map"
        element={
          <ProtectedRoute allowedRole="advocate">
            <IncomeDistributionMapPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/vulnerability-flags"
        element={
          <ProtectedRoute allowedRole="advocate">
            <VulnerabilityFlagsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/advocate/profile-settings"
        element={
          <ProtectedRoute allowedRole="advocate">
            <AdvocateProfileSettingsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRole="worker">
            <App />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/log-shift"
        element={
          <ProtectedRoute allowedRole="worker">
            <LogShiftPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/my-earnings"
        element={
          <ProtectedRoute allowedRole="worker">
            <MyEarningsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/my-analytics"
        element={
          <ProtectedRoute allowedRole="worker">
            <MyAnalyticsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/income-certificate"
        element={
          <ProtectedRoute allowedRole="worker">
            <IncomeCertificatePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/grievance-board"
        element={
          <ProtectedRoute allowedRole="worker">
            <GrievanceBoardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/profile-settings"
        element={
          <ProtectedRoute allowedRole="worker">
            <ProfileSettingsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/upload-screenshot"
        element={
          <ProtectedRoute allowedRole="worker">
            <UploadScreenshotPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/upload-screenshots"
        element={
          <ProtectedRoute allowedRole="worker">
            <UploadScreenshotPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/dashboard/greivance-board"
        element={
          <ProtectedRoute allowedRole="worker">
            <GrievanceBoardPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/verifier"
        element={
          <ProtectedRoute allowedRole="verifier">
            <Navigate to="/verifier/dashboard" replace />
          </ProtectedRoute>
        }
      />
      <Route
        path="/verifier/dashboard"
        element={
          <ProtectedRoute allowedRole="verifier">
            <VerifierDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/verifier/verification-queue"
        element={
          <ProtectedRoute allowedRole="verifier">
            <VerificationQueuePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/verifier/verification-queue/:submissionId/review"
        element={
          <ProtectedRoute allowedRole="verifier">
            <VerificationReviewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/verifier/verified-history"
        element={
          <ProtectedRoute allowedRole="verifier">
            <VerifiedHistoryPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/verifier/profile-settings"
        element={
          <ProtectedRoute allowedRole="verifier">
            <VerifierProfileSettingsPage />
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
