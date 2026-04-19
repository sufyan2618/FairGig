import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/common/Button'
import { LabeledSelectField } from '../../components/common/LabeledSelectField'
import { LabeledTextField } from '../../components/common/LabeledTextField'
import { ToastOnMessage } from '../../components/common/ToastOnMessage'
import { Sidebar } from '../../components/layout/Sidebar'
import { TopHeader } from '../../components/layout/TopHeader'
import { sidebarItems } from '../../data/dashboardData'
import { useWorkerProfileApi } from '../../hooks/api/useWorkerProfileApi'
import { useSidebarNavigation } from '../../hooks/useSidebarNavigation'
import { classNames } from '../../utils/functions'

const cityOptions = [
  { label: 'Select city', value: '' },
  { label: 'Karachi', value: 'Karachi' },
  { label: 'Lahore', value: 'Lahore' },
  { label: 'Islamabad', value: 'Islamabad' },
  { label: 'Rawalpindi', value: 'Rawalpindi' },
  { label: 'Peshawar', value: 'Peshawar' },
  { label: 'Quetta', value: 'Quetta' },
  { label: 'Other', value: 'Other' },
]

const platformCategoryOptions = [
  { label: 'Select primary category', value: '' },
  { label: 'ride_hailing', value: 'ride_hailing' },
  { label: 'food_delivery', value: 'food_delivery' },
  { label: 'courier', value: 'courier' },
  { label: 'grocery_delivery', value: 'grocery_delivery' },
  { label: 'multi_platform', value: 'multi_platform' },
  { label: 'other', value: 'other' },
]

const ProfileSettingsPage = () => {
  const { activeSidebarItem, onSidebarItemSelect } = useSidebarNavigation()
  const [searchQuery, setSearchQuery] = useState('')

  const {
    profile,
    prefs,
    isLoading,
    isSaving,
    error,
    notice,
    fetchProfile,
    saveAccountDetails,
    changePassword,
    saveNotificationPrefs,
    clearError,
    clearNotice,
  } = useWorkerProfileApi()

  const [name, setName] = useState('')
  const [city, setCity] = useState('')
  const [primaryCategory, setPrimaryCategory] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  useEffect(() => {
    void fetchProfile()
  }, [fetchProfile])

  useEffect(() => {
    if (profile?.full_name) {
      setName(profile.full_name)
    }
  }, [profile?.full_name])

  useEffect(() => {
    setCity(prefs.city)
    setPrimaryCategory(prefs.primaryCategory)
  }, [prefs.city, prefs.primaryCategory])

  const updateNotification = (key: keyof typeof prefs.notifications) => {
    saveNotificationPrefs({
      ...prefs.notifications,
      [key]: !prefs.notifications[key],
    })
  }

  const handleAccountSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    clearError()
    clearNotice()

    if (!name.trim()) {
      return
    }

    try {
      await saveAccountDetails({
        full_name: name.trim(),
        city,
        primaryCategory,
      })
    } catch {
      return
    }
  }

  const handlePasswordUpdate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    clearError()
    clearNotice()

    if (!currentPassword || !newPassword || !confirmPassword) {
      return
    }

    if (newPassword.length < 8) {
      return
    }

    if (newPassword !== confirmPassword) {
      return
    }

    try {
      await changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch {
      return
    }
  }

  const ToggleSwitch = ({
    label,
    description,
    checked,
    onToggle,
  }: {
    label: string
    description: string
    checked: boolean
    onToggle: () => void
  }) => (
    <div className="flex items-start justify-between gap-3 rounded-xl border border-[#e3e7ef] bg-[#f8f9fb] p-3 sm:items-center sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-[#1d1d1d]">{label}</p>
        <p className="mt-0.5 text-xs text-[#667085]">{description}</p>
      </div>

      <button
        type="button"
        onClick={onToggle}
        className={classNames(
          'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center overflow-hidden rounded-full p-0.5 transition-colors sm:mt-0',
          checked ? 'bg-[#1f2024]' : 'bg-[#d3d7df]',
        )}
        aria-pressed={checked}
        aria-label={label}
      >
        <span
          className={classNames(
            'h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200',
            checked ? 'translate-x-5' : 'translate-x-0',
          )}
        />
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#eceef2] text-[#1d1d1d]">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <Sidebar
          items={sidebarItems}
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

            <section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-6">
              <div className="mb-5">
                <h2 className="text-2xl font-semibold text-[#1d1d1d]">My Profile / Settings</h2>
                <p className="mt-1 text-sm text-[#667085]">
                  Manage account details through APIs and save local worker preferences for analytics and notifications.
                </p>
              </div>

              <div className="grid gap-5 xl:grid-cols-2">
                <form onSubmit={handleAccountSave} className="rounded-2xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                  <h3 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Account Details</h3>

                  <div className="grid gap-3">
                    <LabeledTextField
                      label="Full Name"
                      value={name}
                      onChange={setName}
                      placeholder="Enter your full name"
                      required
                    />

                    <LabeledTextField
                      label="Email"
                      value={profile?.email ?? ''}
                      onChange={() => {}}
                      disabled
                    />

                    <LabeledSelectField
                      label="City"
                      options={cityOptions}
                      value={city}
                      onChange={setCity}
                    />

                    <LabeledSelectField
                      label="Primary Platform Category"
                      options={platformCategoryOptions}
                      value={primaryCategory}
                      onChange={setPrimaryCategory}
                    />
                  </div>

                  <div className="mt-4">
                    <Button type="submit" disabled={isSaving || isLoading}>
                      {isSaving ? 'Saving...' : 'Save Account Details'}
                    </Button>
                  </div>
                </form>

                <form onSubmit={handlePasswordUpdate} className="rounded-2xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                  <h3 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Change Password</h3>

                  <div className="grid gap-3">
                    <LabeledTextField
                      label="Current Password"
                      value={currentPassword}
                      onChange={setCurrentPassword}
                      type="password"
                      placeholder="Current password"
                      required
                    />

                    <LabeledTextField
                      label="New Password"
                      value={newPassword}
                      onChange={setNewPassword}
                      type="password"
                      placeholder="At least 8 characters"
                      required
                    />

                    <LabeledTextField
                      label="Confirm New Password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      type="password"
                      placeholder="Re-enter new password"
                      required
                    />
                  </div>

                  <div className="mt-4">
                    <Button type="submit" disabled={isSaving || isLoading}>
                      {isSaving ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </div>

              <div className="mt-5 rounded-2xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
                <h3 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Notification Preferences</h3>

                <div className="grid gap-3">
                  <ToggleSwitch
                    label="App Notifications"
                    description="Receive important updates inside the app"
                    checked={prefs.notifications.appNotifications}
                    onToggle={() => updateNotification('appNotifications')}
                  />
                  <ToggleSwitch
                    label="SMS Alerts"
                    description="Get urgent account and security alerts via SMS"
                    checked={prefs.notifications.smsAlerts}
                    onToggle={() => updateNotification('smsAlerts')}
                  />
                  <ToggleSwitch
                    label="Payout Updates"
                    description="Be notified when weekly payouts are processed"
                    checked={prefs.notifications.payoutUpdates}
                    onToggle={() => updateNotification('payoutUpdates')}
                  />
                  <ToggleSwitch
                    label="Grievance Updates"
                    description="Get status updates for your grievance posts"
                    checked={prefs.notifications.grievanceUpdates}
                    onToggle={() => updateNotification('grievanceUpdates')}
                  />
                </div>

                <div className="mt-4">
                  <Button
                    type="button"
                    onClick={() => saveNotificationPrefs(prefs.notifications)}
                    disabled={isLoading}
                  >
                    Save Preferences
                  </Button>
                </div>
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  )
}

export default ProfileSettingsPage
