import { useEffect, type ReactNode } from 'react'
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { useShallow } from 'zustand/react/shallow'
import { ToastViewport } from './components/common/ToastViewport.tsx'
import { Login } from './pages/Login.tsx'
import { Signup } from './pages/Signup.tsx'
import { VerifyEmailOtp } from './pages/VerifyEmailOtp.tsx'
import { ForgotPassword } from './pages/ForgotPassword.tsx'
import { ResetPassword } from './pages/ResetPassword.tsx'
import AdvocateDashboardPage from './pages/advocate/DashboardPage.tsx'
import CommissionRateTrackerPage from './pages/advocate/CommissionRateTrackerPage.tsx'
import ComplaintAnalyticsPage from './pages/advocate/ComplaintAnalyticsPage.tsx'
import GrievanceModerationPage from './pages/advocate/GrievanceModerationPage.tsx'
import IncomeDistributionMapPage from './pages/advocate/IncomeDistributionMapPage.tsx'
import AdvocateProfileSettingsPage from './pages/advocate/ProfileSettingsPage.tsx'
import VulnerabilityFlagsPage from './pages/advocate/VulnerabilityFlagsPage.tsx'
import VerifierDashboardPage from './pages/verifier/DashboardPage.tsx'
import VerificationQueuePage from './pages/verifier/VerificationQueuePage.tsx'
import VerificationReviewPage from './pages/verifier/VerificationReviewPage.tsx'
import VerifiedHistoryPage from './pages/verifier/VerifiedHistoryPage.tsx'
import VerifierProfileSettingsPage from './pages/verifier/ProfileSettingsPage.tsx'
import DashboardPage from './pages/worker/DashboardPage.tsx'
import LogShiftPage from './pages/worker/LogShiftPage.tsx'
import MyEarningsPage from './pages/worker/MyEarningsPage.tsx'
import MyAnalyticsPage from './pages/worker/MyAnalyticsPage.tsx'
import IncomeCertificatePage from './pages/worker/IncomeCertificatePage.tsx'
import GrievanceBoardPage from './pages/worker/GrievanceBoardPage.tsx'
import ProfileSettingsPage from './pages/worker/ProfileSettingsPage.tsx'
import UploadScreenshotPage from './pages/worker/UploadScreenshotPage.tsx'
import { useAuthStore } from './store/authStore'
import { useToastStore } from './store/toastStore'
import { getHomeRouteForRole } from './utils/auth'
import type { UserRole } from './types/auth'

interface ToastState {
	message: string
	tone?: 'error' | 'success'
}

const RouteToast = () => {
	const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
	const showToast = useToastStore((state) => state.showToast)
	const location = useLocation()
	const navigate = useNavigate()

	useEffect(() => {
		const state = location.state as { toast?: ToastState } | null

		if (!state?.toast) {
			return
		}

		if (state.toast.message === 'Please sign in first.' && isAuthenticated) {
			navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null })
			return
		}

		showToast({
			message: state.toast.message,
			tone: state.toast.tone,
		})
		navigate(`${location.pathname}${location.search}${location.hash}`, { replace: true, state: null })
	}, [isAuthenticated, location.hash, location.pathname, location.search, location.state, navigate, showToast])

	return null
}

interface ProtectedRouteProps {
	allowedRole: UserRole
	children: ReactNode
}

const ProtectedRoute = ({ allowedRole, children }: ProtectedRouteProps) => {
	const { hasHydrated, isAuthenticated, user } = useAuthStore(
		useShallow((state) => ({
			hasHydrated: state.hasHydrated,
			isAuthenticated: state.isAuthenticated,
			user: state.user,
		})),
	)

	if (!hasHydrated) {
		return null
	}

	if (!isAuthenticated || !user) {
		return <Navigate to="/login" replace state={{ toast: { message: 'Please sign in first.', tone: 'error' } }} />
	}

	if (user.role !== allowedRole) {
		return (
			<Navigate
				to={getHomeRouteForRole(user.role)}
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

	return <>{children}</>
}

interface PublicOnlyRouteProps {
	children: ReactNode
}

const PublicOnlyRoute = ({ children }: PublicOnlyRouteProps) => {
	const { hasHydrated, isAuthenticated, user } = useAuthStore(
		useShallow((state) => ({
			hasHydrated: state.hasHydrated,
			isAuthenticated: state.isAuthenticated,
			user: state.user,
		})),
	)

	if (!hasHydrated) {
		return null
	}

	if (isAuthenticated && user) {
		return <Navigate to={getHomeRouteForRole(user.role)} replace />
	}

	return <>{children}</>
}

const FallbackRedirect = () => {
	const { hasHydrated, isAuthenticated, user } = useAuthStore(
		useShallow((state) => ({
			hasHydrated: state.hasHydrated,
			isAuthenticated: state.isAuthenticated,
			user: state.user,
		})),
	)

	if (!hasHydrated) {
		return null
	}

	if (!isAuthenticated || !user) {
		return <Navigate to="/login" replace />
	}

	return (
		<Navigate
			to={getHomeRouteForRole(user.role)}
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
		<ToastViewport />
		<Routes>
			<Route
				path="/login"
				element={
					<PublicOnlyRoute>
						<Login />
					</PublicOnlyRoute>
				}
			/>
			<Route
				path="/signup"
				element={
					<PublicOnlyRoute>
						<Signup />
					</PublicOnlyRoute>
				}
			/>
			<Route
				path="/verify-email-otp"
				element={
					<PublicOnlyRoute>
						<VerifyEmailOtp />
					</PublicOnlyRoute>
				}
			/>
			<Route
				path="/forgot-password"
				element={
					<PublicOnlyRoute>
						<ForgotPassword />
					</PublicOnlyRoute>
				}
			/>
			<Route
				path="/reset-password"
				element={
					<PublicOnlyRoute>
						<ResetPassword />
					</PublicOnlyRoute>
				}
			/>

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
						<DashboardPage />
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

const App = () => (
	<BrowserRouter>
		<AppRoutes />
	</BrowserRouter>
)

export default App