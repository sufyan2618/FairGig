import { useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLottie } from 'lottie-react'
import resetAnimation from '../animations/Login verification.json'
import logo from '../assets/logo.jpeg'
import { useAuthApi } from '../hooks/api/useAuthApi'

export const ResetPassword = () => {
	const { View: resetAnimationView } = useLottie({
		animationData: resetAnimation,
		loop: true,
		autoplay: true,
	})

	const navigate = useNavigate()
	const location = useLocation()
	const { resetPassword, passwordResetEmail, isLoading, error, clearError } = useAuthApi()

	const initialEmail = useMemo(() => {
		const params = new URLSearchParams(location.search)
		return params.get('email') ?? passwordResetEmail ?? ''
	}, [location.search, passwordResetEmail])

	const [email, setEmail] = useState(initialEmail)
	const [otpCode, setOtpCode] = useState('')
	const [newPassword, setNewPassword] = useState('')
	const [confirmPassword, setConfirmPassword] = useState('')
	const [notice, setNotice] = useState('')

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		clearError()
		setNotice('')

		if (newPassword.length < 8) {
			setNotice('New password must be at least 8 characters long.')
			return
		}

		if (newPassword !== confirmPassword) {
			setNotice('New password and confirm password do not match.')
			return
		}

		try {
			await resetPassword({
				email: email.trim().toLowerCase(),
				otp_code: otpCode.trim(),
				new_password: newPassword,
			})

			navigate('/login', {
				replace: true,
				state: {
					toast: {
						message: 'Password reset successful. You can sign in now.',
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
					aria-label="Reset preview"
					className="flex flex-col rounded-3xl border border-[#FF914D]/20 bg-white/80 p-3 shadow-xl shadow-[#FF914D]/10 backdrop-blur-sm sm:p-3.5"
				>
					<div className="mb-2 flex min-h-32 items-center justify-center overflow-hidden rounded-2xl bg-[#FFF9F4] p-1.5 sm:min-h-40 sm:p-2 md:min-h-48 [&>div]:h-full [&>div]:w-full">
						{resetAnimationView}
					</div>

					<h2 className="text-base font-bold tracking-tight sm:text-lg">Set a new password</h2>
					<p className="mt-1.5 text-sm leading-5 text-[#1D1D1D]/80 sm:text-sm">
						Use the OTP from your email and choose a strong password to secure your FairGig account.
					</p>
				</section>

				<section
					aria-label="Reset password form"
					className="flex flex-col justify-center rounded-3xl border border-[#1D1D1D]/10 bg-white p-3 shadow-xl shadow-[#1D1D1D]/5 sm:p-3.5"
				>
					<div className="mb-2.5 flex items-center gap-2.5">
						<span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#1D1D1D]/10 bg-white">
							<img src={logo} alt="FairGig logo" className="h-full w-full object-cover" />
						</span>
						<strong className="text-base tracking-wide">FairGig</strong>
					</div>

					<h1 className="text-lg font-black tracking-tight sm:text-xl">Reset password</h1>
					<p className="mt-1.5 text-sm text-[#1D1D1D]/70">Enter your OTP and set a new password.</p>

					<form onSubmit={onSubmit} className="mt-3.5 space-y-2.5">
						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="email">
								Email address
							</label>
							<input
								id="email"
								type="email"
								value={email}
								onChange={(event) => setEmail(event.target.value)}
								autoComplete="email"
								required
								className="w-full rounded-xl border border-[#1D1D1D]/15 bg-[#FFFCFA] px-3.5 py-2 text-sm outline-none ring-[#FF914D] transition focus:border-[#FF914D] focus:ring-2"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="otpCode">
								OTP code
							</label>
							<input
								id="otpCode"
								type="text"
								placeholder="6-digit OTP"
								value={otpCode}
								onChange={(event) => setOtpCode(event.target.value)}
								autoComplete="one-time-code"
								required
								className="w-full rounded-xl border border-[#1D1D1D]/15 bg-[#FFFCFA] px-3.5 py-2 text-sm tracking-[0.2em] outline-none ring-[#FF914D] transition focus:border-[#FF914D] focus:ring-2"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="newPassword">
								New password
							</label>
							<input
								id="newPassword"
								type="password"
								value={newPassword}
								onChange={(event) => setNewPassword(event.target.value)}
								autoComplete="new-password"
								required
								className="w-full rounded-xl border border-[#1D1D1D]/15 bg-[#FFFCFA] px-3.5 py-2 text-sm outline-none ring-[#FF914D] transition focus:border-[#FF914D] focus:ring-2"
							/>
						</div>

						<div className="space-y-2">
							<label className="text-sm font-medium" htmlFor="confirmPassword">
								Confirm new password
							</label>
							<input
								id="confirmPassword"
								type="password"
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
								autoComplete="new-password"
								required
								className="w-full rounded-xl border border-[#1D1D1D]/15 bg-[#FFFCFA] px-3.5 py-2 text-sm outline-none ring-[#FF914D] transition focus:border-[#FF914D] focus:ring-2"
							/>
						</div>

						{error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
						{notice ? <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">{notice}</p> : null}

						<button
							type="submit"
							disabled={isLoading}
							className="w-full rounded-xl bg-[#FF914D] px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-95"
						>
							{isLoading ? 'Resetting password...' : 'Reset password'}
						</button>
					</form>

					<p className="mt-2.5 text-sm text-[#1D1D1D]/75">
						Didn&apos;t get an OTP?{' '}
						<Link to="/forgot-password" className="font-semibold text-[#FF914D] hover:underline">
							Request again
						</Link>
					</p>
				</section>
			</div>
		</main>
	)
}