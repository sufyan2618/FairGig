import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/common/Button'
import { LabeledTextField } from '../../components/common/LabeledTextField'
import { ToastOnMessage } from '../../components/common/ToastOnMessage'
import { Sidebar } from '../../components/layout/Sidebar'
import { TopHeader } from '../../components/layout/TopHeader'
import { advocateSidebarItems } from '../../data/advocateData'
import { useAdvocateProfileApi } from '../../hooks/api/useAdvocateProfileApi'
import { useSidebarNavigation } from '../../hooks/useSidebarNavigation'

const AdvocateProfileSettingsPage = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [localNotice, setLocalNotice] = useState('')
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation()

  const {
    profile,
    isLoading,
    isSaving,
    error,
    notice,
    fetchProfile,
    saveProfile,
    changePassword,
    clearError,
    clearNotice,
    passwordPayload,
    updateProfileField,
    updatePasswordField,
    resetPasswordPayload,
  } = useAdvocateProfileApi()

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  const handleProfileSave = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()
    clearNotice()
    setLocalNotice('')

    if (!profile?.fullName.trim()) {
      setLocalNotice('Full name is required.')
      return
    }

    void saveProfile()
  }

  const handlePasswordChange = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    clearError()
    clearNotice()
    setLocalNotice('')

    if (
      !passwordPayload.currentPassword ||
      !passwordPayload.newPassword ||
      !passwordPayload.confirmPassword
    ) {
      setLocalNotice('Please fill all password fields.')
      return
    }

    if (passwordPayload.newPassword.length < 8) {
      setLocalNotice('New password must be at least 8 characters.')
      return
    }

    if (passwordPayload.newPassword !== passwordPayload.confirmPassword) {
      setLocalNotice('New and confirm password do not match.')
      return
    }

    void changePassword().then(() => {
      resetPasswordPayload()
    })
  }

  return (
    <div className="min-h-screen bg-[#eceef2] text-[#1d1d1d]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar
          items={advocateSidebarItems}
          activeItemId={activeSidebarItem}
          onItemSelect={onSidebarItemSelect}
        />

        <main className="relative flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
          <div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-(--color-button)/8 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#4a5d7d]/10 blur-3xl" />

          <div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
            <TopHeader searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
            <ToastOnMessage message={error} tone="error" onShown={clearError} />
            <ToastOnMessage message={notice} tone="success" onShown={clearNotice} />
            <ToastOnMessage message={localNotice} tone="warning" onShown={() => setLocalNotice('')} />

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-6">
              <h2 className="text-2xl font-semibold text-[#1d1d1d]">My Profile / Settings</h2>
              <p className="mt-1 text-sm text-[#667085]">
                Manage your advocate account details and update your password securely.
              </p>

              <div className="mt-5 grid gap-5 xl:grid-cols-2">
                <form
                  onSubmit={handleProfileSave}
                  className="rounded-2xl border border-[#e3e7ef] bg-[#f8f9fb] p-4"
                >
                  <h3 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Account Settings</h3>
                  <div className="grid gap-3">
                    <LabeledTextField
                      label="Full Name"
                      value={profile?.fullName ?? ''}
                      onChange={(value) => updateProfileField('fullName', value)}
                      placeholder="Enter full name"
                      required
                    />
                    <LabeledTextField
                      label="Email Address"
                      type="email"
                      value={profile?.email ?? ''}
                      onChange={() => undefined}
                      required
                      disabled
                    />
                  </div>
                  <div className="mt-4">
                    <Button type="submit" disabled={isLoading || isSaving || !profile}>
                      {isSaving ? 'Saving...' : 'Save Account Settings'}
                    </Button>
                  </div>
                </form>

                <form
                  onSubmit={handlePasswordChange}
                  className="rounded-2xl border border-[#e3e7ef] bg-[#f8f9fb] p-4"
                >
                  <h3 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Password Change</h3>
                  <div className="grid gap-3">
                    <LabeledTextField
                      label="Current Password"
                      value={passwordPayload.currentPassword}
                      onChange={(value) => updatePasswordField('currentPassword', value)}
                      type="password"
                      placeholder="Current password"
                      required
                    />
                    <LabeledTextField
                      label="New Password"
                      value={passwordPayload.newPassword}
                      onChange={(value) => updatePasswordField('newPassword', value)}
                      type="password"
                      placeholder="At least 8 characters"
                      required
                    />
                    <LabeledTextField
                      label="Confirm New Password"
                      value={passwordPayload.confirmPassword}
                      onChange={(value) => updatePasswordField('confirmPassword', value)}
                      type="password"
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>
                  <div className="mt-4">
                    <Button type="submit" disabled={isLoading || isSaving}>
                      {isSaving ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default AdvocateProfileSettingsPage
