import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '../../components/common/Button'
import { Icon } from '../../components/common/Icon'
import { LabeledTextField } from '../../components/common/LabeledTextField'
import { ToastOnMessage } from '../../components/common/ToastOnMessage'
import { TopHeader } from '../../components/layout/TopHeader'
import { useVerifierProfileApi } from '../../hooks/api/useVerifierProfileApi'
import { useVerifierSidebarNavigation } from '../../hooks/useVerifierSidebarNavigation'
import { classNames } from '../../utils/functions'
import logo from '../../assets/logo.jpeg'

const VerifierProfileSettingsPage = () => {
	const { sidebarItems, activeSidebarItem, onSidebarItemSelect } =
		useVerifierSidebarNavigation()
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
 	} = useVerifierProfileApi()

	const [searchQuery, setSearchQuery] = useState('')
	const [localNotice, setLocalNotice] = useState('')

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

	const handlePasswordSave = (event: FormEvent<HTMLFormElement>) => {
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
				<aside className="w-full bg-[#232429] text-white lg:min-h-screen lg:w-72">
					<div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
						<div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-2xl bg-linear-to-br from-[#141518] to-[#2f3239] ring-1 ring-white/10">
							<img src={logo} alt="FairGig logo" className="h-full w-full object-cover scale-110" />
						</div>
						<div>
							<p className="text-sm font-semibold">FairGig</p>
							<p className="text-xs text-white/60">Verifier Console</p>
						</div>
					</div>

					<nav className="flex flex-col gap-1 px-4 py-4">
						{sidebarItems.map((item) => {
							const isActive = item.id === activeSidebarItem;

							return (
								<button
									key={item.id}
									type="button"
									onClick={() => onSidebarItemSelect(item.id)}
									className={classNames(
										"group flex items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-medium transition-all duration-200",
										isActive
											? "bg-(--color-button) text-white shadow-[0_8px_20px_rgba(255,145,77,0.3)]"
											: "text-white/80 hover:bg-white/10 hover:text-white",
									)}
								>
									<Icon
										name={item.icon}
										className={classNames("h-4 w-4", isActive ? "text-white" : "text-white/70")}
									/>
									<span>{item.label}</span>
								</button>
							);
						})}
					</nav>
				</aside>

				<main className="relative flex-1 overflow-hidden p-4 md:p-6 lg:p-8">
					<div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-(--color-button)/8 blur-3xl" />
					<div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#4a5d7d]/10 blur-3xl" />

					<div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
						<TopHeader searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />
						<ToastOnMessage message={error} tone="error" onShown={clearError} />
						<ToastOnMessage message={notice} tone="success" onShown={clearNotice} />
						<ToastOnMessage message={localNotice} tone="warning" onShown={() => setLocalNotice('')} />

						<section className="animate-fade-up rounded-2xl border border-[#dde2ea] bg-white p-5 shadow-[0_10px_24px_rgba(16,24,40,0.05)] md:p-6">
							<div className="mb-5">
								<h2 className="text-xl font-semibold text-[#1d1d1d]">My Profile / Settings</h2>
								<p className="mt-1 text-sm text-[#667085]">
									Manage verifier account information and password settings.
								</p>
							</div>

							<div className="grid gap-5 xl:grid-cols-2">
								<form onSubmit={handleProfileSave} className="rounded-2xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
									<h3 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Account Settings</h3>
									<div className="grid gap-3">
										<LabeledTextField
											label="Full Name"
											value={profile?.fullName ?? ''}
											onChange={(value) => updateProfileField("fullName", value)}
											required
										/>
										<LabeledTextField
											label="Email"
											type="email"
											value={profile?.email ?? ''}
											onChange={() => undefined}
											required
											disabled
										/>
									</div>

									<div className="mt-4">
										<Button type="submit" disabled={isLoading || isSaving || !profile}>
											{isSaving ? 'Saving...' : 'Save Account'}
										</Button>
									</div>
								</form>

								<form onSubmit={handlePasswordSave} className="rounded-2xl border border-[#e3e7ef] bg-[#f8f9fb] p-4">
									<h3 className="mb-3 text-lg font-semibold text-[#1d1d1d]">Change Password</h3>
									<div className="grid gap-3">
										<LabeledTextField
											label="Current Password"
											type="password"
											value={passwordPayload.currentPassword}
											onChange={(value) => updatePasswordField("currentPassword", value)}
											required
										/>
										<LabeledTextField
											label="New Password"
											type="password"
											value={passwordPayload.newPassword}
											onChange={(value) => updatePasswordField("newPassword", value)}
											required
										/>
										<LabeledTextField
											label="Confirm New Password"
											type="password"
											value={passwordPayload.confirmPassword}
											onChange={(value) => updatePasswordField("confirmPassword", value)}
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

export default VerifierProfileSettingsPage
