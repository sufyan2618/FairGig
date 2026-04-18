import { useState, type FormEvent } from "react";
import { Button } from "../../components/common/Button";
import { Icon } from "../../components/common/Icon";
import { LabeledTextField } from "../../components/common/LabeledTextField";
import { TopHeader } from "../../components/layout/TopHeader";
import { useVerifierProfileSettings } from "../../hooks/useVerifierProfileSettings";
import { useVerifierSidebarNavigation } from "../../hooks/useVerifierSidebarNavigation";
import { classNames } from "../../utils/functions";

const VerifierProfileSettingsPage = () => {
	const { sidebarItems, activeSidebarItem, onSidebarItemSelect } =
		useVerifierSidebarNavigation();
	const {
		profile,
		passwordPayload,
		updateProfileField,
		updatePasswordField,
		resetPasswordPayload,
	} = useVerifierProfileSettings();

	const [searchQuery, setSearchQuery] = useState("");
	const [notice, setNotice] = useState("");

	const handleProfileSave = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (!profile.fullName.trim() || !profile.email.trim()) {
			setNotice("Full name and email are required.");
			return;
		}

		setNotice("Profile settings updated successfully.");
	};

	const handlePasswordSave = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (
			!passwordPayload.currentPassword ||
			!passwordPayload.newPassword ||
			!passwordPayload.confirmPassword
		) {
			setNotice("Please fill all password fields.");
			return;
		}

		if (passwordPayload.newPassword.length < 8) {
			setNotice("New password must be at least 8 characters.");
			return;
		}

		if (passwordPayload.newPassword !== passwordPayload.confirmPassword) {
			setNotice("New and confirm password do not match.");
			return;
		}

		setNotice("Password changed successfully.");
		resetPasswordPayload();
	};

	return (
		<div className="min-h-screen bg-[#eceef2] text-[#1d1d1d]">
			<div className="flex min-h-screen flex-col lg:flex-row">
				<aside className="w-full bg-[#232429] text-white lg:min-h-screen lg:w-72">
					<div className="flex items-center gap-3 border-b border-white/10 px-6 py-6">
						<div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-[#141518] to-[#2f3239] ring-1 ring-white/10">
							<span className="text-lg font-bold text-[var(--color-button)]">FG</span>
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
											? "bg-[var(--color-button)] text-white shadow-[0_8px_20px_rgba(255,145,77,0.3)]"
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
					<div className="pointer-events-none absolute -left-24 -top-24 h-64 w-64 rounded-full bg-[var(--color-button)]/8 blur-3xl" />
					<div className="pointer-events-none absolute -bottom-20 right-0 h-72 w-72 rounded-full bg-[#4a5d7d]/10 blur-3xl" />

					<div className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-6">
						<TopHeader searchQuery={searchQuery} onSearchQueryChange={setSearchQuery} />

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
											value={profile.fullName}
											onChange={(value) => updateProfileField("fullName", value)}
											required
										/>
										<LabeledTextField
											label="Email"
											type="email"
											value={profile.email}
											onChange={(value) => updateProfileField("email", value)}
											required
										/>
										<LabeledTextField
											label="Phone"
											value={profile.phone}
											onChange={(value) => updateProfileField("phone", value)}
										/>
										<LabeledTextField
											label="Timezone"
											value={profile.timezone}
											onChange={(value) => updateProfileField("timezone", value)}
										/>
									</div>

									<div className="mt-4">
										<Button type="submit">Save Account</Button>
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
										<Button type="submit">Update Password</Button>
									</div>
								</form>
							</div>

							{notice ? (
								<p className="mt-4 rounded-xl border border-[#e1e4eb] bg-[#f7f8fa] px-3 py-2 text-sm text-[#425066]">
									{notice}
								</p>
							) : null}
						</section>
					</div>
				</main>
			</div>
		</div>
	);
};

export default VerifierProfileSettingsPage;
