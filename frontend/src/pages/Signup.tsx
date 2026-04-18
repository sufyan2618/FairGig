import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLottie } from 'lottie-react'
import signupAnimation from '../animations/Login verification.json'
import logo from '../assets/logo.jpeg'
import { useAuthApi } from '../hooks/api/useAuthApi'
import type { UserRole } from '../types/auth'

export const Signup = () => {
	const { View: signupAnimationView } = useLottie({
		animationData: signupAnimation,
		loop: true,
		autoplay: true,
	})

	const navigate = useNavigate()
	const { register, isLoading, error, clearError } = useAuthApi()
	const [fullName, setFullName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [role, setRole] = useState<UserRole>('worker')
	const [message, setMessage] = useState('')

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		clearError()
		setMessage('')

		const normalizedEmail = email.trim().toLowerCase()

		try {
			const response = await register({
				full_name: fullName.trim(),
				email: normalizedEmail,
				password,
				role,
			})

			setMessage(response.message)

			navigate(`/verify-email-otp?email=${encodeURIComponent(normalizedEmail)}`, {
				replace: true,
				state: {
					toast: {
						message: response.message,
						tone: 'success',
					},
				},
			})
		} catch {
			return
		}
	}

	return (
		<main className="auth-viewport relative min-h-dvh bg-[#FFF4EB] text-[#1D1D1D]">
			<div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#FF914D]/20 blur-3xl" />
			<div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#FF914D]/25 blur-3xl" />

			<div className="auth-content relative mx-auto grid w-full max-w-4xl grid-cols-1 items-start gap-2.5 px-3 py-2 sm:px-4 md:grid-cols-2 md:items-stretch md:gap-2.5 lg:gap-3 lg:py-2">
				<section
					aria-label="Onboarding preview"
					className="flex flex-col rounded-3xl border border-[#FF914D]/20 bg-white/80 p-3 shadow-xl shadow-[#FF914D]/10 backdrop-blur-sm sm:p-3.5"
				>
					<div className="mb-2 flex min-h-32 items-center justify-center overflow-hidden rounded-2xl bg-[#FFF9F4] p-1.5 sm:min-h-40 sm:p-2 md:min-h-48 [&>div]:h-full [&>div]:w-full">
						{signupAnimationView}
					</div>

					<h2 className="text-base font-bold tracking-tight sm:text-lg">Launch Campaigns Faster</h2>
					<p className="mt-1.5 text-sm leading-5 text-[#1D1D1D]/80 sm:text-sm">
						Create your FairGig account to track earnings, submit evidence, and collaborate across worker support
						roles.
					</p>

					<div className="mt-2.5 flex items-center gap-2 rounded-xl bg-[#1D1D1D] px-3 py-1.5 text-white" aria-hidden="true">
						<div className="-space-x-2">
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-[#FF914D] text-xs font-semibold">
								N
							</span>
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-[#F9703E] text-xs font-semibold">
								K
							</span>
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-[#E85D2F] text-xs font-semibold">
								R
							</span>
						</div>
						<small className="text-xs text-white/90 sm:text-sm">Secure onboarding with OTP verification</small>
					</div>
				</section>

				<section
					aria-label="Signup form"
					className="flex flex-col justify-center rounded-3xl border border-[#1D1D1D]/10 bg-white p-3 shadow-xl shadow-[#1D1D1D]/5 sm:p-3.5"
				>
					<div className="mb-2.5 flex items-center gap-2.5">
						<span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#1D1D1D]/10 bg-white">
							<img src={logo} alt="FairGig logo" className="h-full w-full object-cover" />
						</span>
						<strong className="text-base tracking-wide">FairGig</strong>
					</div>

					<h1 className="text-lg font-black tracking-tight sm:text-xl">Create account</h1>
					<p className="mt-1.5 text-sm text-[#1D1D1D]/70">Set up your account. We will send a verification OTP to your email.</p>

					<form onSubmit={onSubmit} className="mt-3.5 space-y-2.5">
						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="fullName">
								Full name
							</label>
							<input
								id="fullName"
								type="text"
								placeholder="Jane Doe"
								value={fullName}
								onChange={(event) => setFullName(event.target.value)}
								autoComplete="name"
								required
								className="w-full rounded-xl border border-[#1D1D1D]/15 bg-[#FFFCFA] px-3.5 py-2 text-sm outline-none ring-[#FF914D] transition focus:border-[#FF914D] focus:ring-2"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="email">
								Email address
							</label>
							<input
								id="email"
								type="email"
								placeholder="name@company.com"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								autoComplete="email"
								required
								className="w-full rounded-xl border border-[#1D1D1D]/15 bg-[#FFFCFA] px-3.5 py-2 text-sm outline-none ring-[#FF914D] transition focus:border-[#FF914D] focus:ring-2"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="password">
								Password
							</label>
							<input
								id="password"
								type="password"
								placeholder="Create a password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								autoComplete="new-password"
								required
								className="w-full rounded-xl border border-[#1D1D1D]/15 bg-[#FFFCFA] px-3.5 py-2 text-sm outline-none ring-[#FF914D] transition focus:border-[#FF914D] focus:ring-2"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="role">
								Role
							</label>
							<select
								id="role"
								value={role}
								onChange={(event) => setRole(event.target.value as UserRole)}
								className="w-full rounded-xl border border-[#1D1D1D]/15 bg-[#FFFCFA] px-3.5 py-2 text-sm outline-none ring-[#FF914D] transition focus:border-[#FF914D] focus:ring-2"
							>
								<option value="worker">Worker</option>
								<option value="verifier">Verifier</option>
								<option value="advocate">Advocate</option>
							</select>
						</div>

						{error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

						{message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

						<button
							type="submit"
							disabled={isLoading}
							className="w-full rounded-xl bg-[#FF914D] px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-95"
						>
							{isLoading ? 'Creating account...' : 'Create account'}
						</button>
					</form>

					<p className="mt-2.5 text-sm text-[#1D1D1D]/75">
						Already have an account?{' '}
						<Link to="/login" className="font-semibold text-[#FF914D] hover:underline">
							Sign in
						</Link>
					</p>

					<p className="mt-3 text-xs text-[#1D1D1D]/50">@ 2026 FairGig Inc. All rights reserved.</p>
				</section>
			</div>
		</main>
	)
}
