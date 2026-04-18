import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
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
import LogShiftPage from './pages/worker/LogShiftPage.tsx'
import MyEarningsPage from './pages/worker/MyEarningsPage.tsx'
import MyAnalyticsPage from './pages/worker/MyAnalyticsPage.tsx'
import IncomeCertificatePage from './pages/worker/IncomeCertificatePage.tsx'
import GrievanceBoardPage from './pages/worker/GrievanceBoardPage.tsx'
import ProfileSettingsPage from './pages/worker/ProfileSettingsPage.tsx'
import UploadScreenshotPage from './pages/worker/UploadScreenshotPage.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/advocate/dashboard" element={<AdvocateDashboardPage />} />
        <Route path="/advocate/commission-tracker" element={<CommissionRateTrackerPage />} />
        <Route path="/advocate/complaint-analytics" element={<ComplaintAnalyticsPage />} />
        <Route path="/advocate/grievance-board" element={<GrievanceModerationPage />} />
        <Route path="/advocate/income-distribution-map" element={<IncomeDistributionMapPage />} />
        <Route path="/advocate/profile-settings" element={<AdvocateProfileSettingsPage />} />
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
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  </StrictMode>,
)
