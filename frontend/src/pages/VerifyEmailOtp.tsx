import { useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLottie } from 'lottie-react'
import otpAnimation from '../animations/Login verification.json'
import logo from '../assets/logo.jpeg'
import { useAuthApi } from '../hooks/api/useAuthApi'

export const VerifyEmailOtp = () => {
	const { View: otpAnimationView } = useLottie({
		animationData: otpAnimation,
		loop: true,
		autoplay: true,
	})

	const navigate = useNavigate()
	const location = useLocation()
	const {
		pendingVerificationEmail,
		verifyEmailOtp,
		resendEmailOtp,
		isLoading,
		error,
		clearError,
	} = useAuthApi()

	const initialEmail = useMemo(() => {
		const params = new URLSearchParams(location.search)
		return params.get('email') ?? pendingVerificationEmail ?? ''
	}, [location.search, pendingVerificationEmail])

	const [email, setEmail] = useState(initialEmail)
	const [otpCode, setOtpCode] = useState('')
	const [notice, setNotice] = useState('')

	const onVerify = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		clearError()
		setNotice('')

		try {
			await verifyEmailOtp(email.trim().toLowerCase(), otpCode.trim())
			navigate('/login', {
				replace: true,
				state: {
					toast: {
						message: 'Email verified successfully. Please sign in.',
						tone: 'success',
					},
				},
			})
		} catch {
			return
		}
	}

	const onResendOtp = async () => {
		if (!email.trim()) {
			setNotice('Please enter your email first.')
			return
		}

		clearError()
		setNotice('')

		try {
			const response = await resendEmailOtp(email.trim().toLowerCase())
			setNotice(response.message)
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
					aria-label="OTP preview"
					className="flex flex-col rounded-3xl border border-[#FF914D]/20 bg-white/80 p-3 shadow-xl shadow-[#FF914D]/10 backdrop-blur-sm sm:p-3.5"
				>
					<div className="mb-2 flex min-h-32 items-center justify-center overflow-hidden rounded-2xl bg-[#FFF9F4] p-1.5 sm:min-h-40 sm:p-2 md:min-h-48 [&>div]:h-full [&>div]:w-full">
						{otpAnimationView}
					</div>

					<h2 className="text-base font-bold tracking-tight sm:text-lg">Verify your email</h2>
					<p className="mt-1.5 text-sm leading-5 text-[#1D1D1D]/80 sm:text-sm">
						Enter the OTP sent to your inbox to activate your FairGig account and unlock secure login.
					</p>

					<div className="mt-2.5 rounded-xl border border-[#FF914D]/20 bg-[#FFF8F2] px-3 py-2 text-xs text-[#8A4B23]">
						OTP codes expire quickly. If it has expired, request a new one below.
					</div>
				</section>

				<section
					aria-label="OTP form"
					className="flex flex-col justify-center rounded-3xl border border-[#1D1D1D]/10 bg-white p-3 shadow-xl shadow-[#1D1D1D]/5 sm:p-3.5"
				>
					<div className="mb-2.5 flex items-center gap-2.5">
						<span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#1D1D1D]/10 bg-white">
							<img src={logo} alt="FairGig logo" className="h-full w-full object-cover" />
						</span>
						<strong className="text-base tracking-wide">FairGig</strong>
					</div>

					<h1 className="text-lg font-black tracking-tight sm:text-xl">Email OTP Verification</h1>
					<p className="mt-1.5 text-sm text-[#1D1D1D]/70">Confirm your email address to continue.</p>

					<form onSubmit={onVerify} className="mt-3.5 space-y-2.5">
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

						{error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}
						{notice ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p> : null}

						<button
							type="submit"
							disabled={isLoading}
							className="w-full rounded-xl bg-[#FF914D] px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-95"
						>
							{isLoading ? 'Verifying...' : 'Verify OTP'}
						</button>

						<button
							type="button"
							onClick={onResendOtp}
							disabled={isLoading}
							className="w-full rounded-xl border border-[#1D1D1D]/15 bg-white px-3.5 py-2 text-sm font-medium text-[#1D1D1D] transition hover:bg-[#FFF7F0]"
						>
							Resend OTP
						</button>
					</form>

					<p className="mt-2.5 text-sm text-[#1D1D1D]/75">
						Need a different email?{' '}
						<Link to="/signup" className="font-semibold text-[#FF914D] hover:underline">
							Create account again
						</Link>
					</p>

					<p className="mt-1.5 text-sm text-[#1D1D1D]/75">
						Already verified?{' '}
						<Link to="/login" className="font-semibold text-[#FF914D] hover:underline">
							Sign in
						</Link>
					</p>
				</section>
			</div>
		</main>
	)
}