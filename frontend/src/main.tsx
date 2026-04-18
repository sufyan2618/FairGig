import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './index.css'
import App from './App.tsx'
import { Login } from './pages/Login.tsx'
import { Signup } from './pages/Signup.tsx'
import LogShiftPage from './pages/worker/LogShiftPage.tsx'
import MyEarningsPage from './pages/worker/MyEarningsPage.tsx'
import MyAnalyticsPage from './pages/worker/MyAnalyticsPage.tsx'
import IncomeCertificatePage from './pages/worker/IncomeCertificatePage.tsx'
import GrievanceBoardPage from './pages/worker/GrievanceBoardPage.tsx'
import ProfileSettingsPage from './pages/worker/ProfileSettingsPage.tsx'
import UploadScreenshotPage from './pages/worker/UploadScreenshotPage.tsx'
import VerifierDashboardPage from './pages/verifier/DashboardPage.tsx'
import VerificationQueuePage from './pages/verifier/VerificationQueuePage.tsx'
import VerificationReviewPage from './pages/verifier/VerificationReviewPage.tsx'
import VerifiedHistoryPage from './pages/verifier/VerifiedHistoryPage.tsx'
import VerifierProfileSettingsPage from './pages/verifier/ProfileSettingsPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<App />} />
        <Route path="/dashboard/log-shift" element={<LogShiftPage />} />
        <Route path="/dashboard/my-earnings" element={<MyEarningsPage />} />
        <Route path="/dashboard/my-analytics" element={<MyAnalyticsPage />} />
        <Route path="/dashboard/income-certificate" element={<IncomeCertificatePage />} />
        <Route path="/dashboard/grievance-board" element={<GrievanceBoardPage />} />
        <Route path="/dashboard/profile-settings" element={<ProfileSettingsPage />} />
        <Route path="/dashboard/upload-screenshot" element={<UploadScreenshotPage />} />
        <Route path="/dashboard/upload-screenshots" element={<UploadScreenshotPage />} />
        <Route path="/dashboard/greivance-board" element={<GrievanceBoardPage />} />
        <Route path="/verifier" element={<Navigate to="/verifier/dashboard" replace />} />
        <Route path="/verifier/dashboard" element={<VerifierDashboardPage />} />
        <Route path="/verifier/verification-queue" element={<VerificationQueuePage />} />
        <Route path="/verifier/verification-queue/:submissionId/review" element={<VerificationReviewPage />} />
        <Route path="/verifier/verified-history" element={<VerifiedHistoryPage />} />
        <Route path="/verifier/profile-settings" element={<VerifierProfileSettingsPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
