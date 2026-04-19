import { useMemo, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLottie } from 'lottie-react'
import forgotAnimation from '../animations/Login verification.json'
import logo from '../assets/logo.jpeg'
import { ToastOnMessage } from '../components/common/ToastOnMessage'
import { useAuthApi } from '../hooks/api/useAuthApi'

export const ForgotPassword = () => {
	const { View: forgotAnimationView } = useLottie({
		animationData: forgotAnimation,
		loop: true,
		autoplay: true,
	})

	const navigate = useNavigate()
	const location = useLocation()
	const { forgotPassword, passwordResetEmail, isLoading, error, clearError } = useAuthApi()

	const initialEmail = useMemo(() => {
		const params = new URLSearchParams(location.search)
		return params.get('email') ?? passwordResetEmail ?? ''
	}, [location.search, passwordResetEmail])

	const [email, setEmail] = useState(initialEmail)
	const [notice, setNotice] = useState('')

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		clearError()
		setNotice('')

		const normalizedEmail = email.trim().toLowerCase()

		try {
			const response = await forgotPassword(normalizedEmail)
			setNotice(response.message)

			navigate(`/reset-password?email=${encodeURIComponent(normalizedEmail)}`, {
				replace: false,
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
					aria-label="Forgot password preview"
					className="flex flex-col rounded-3xl border border-[#FF914D]/20 bg-white/80 p-3 shadow-xl shadow-[#FF914D]/10 backdrop-blur-sm sm:p-3.5"
				>
					<div className="mb-2 flex min-h-32 items-center justify-center overflow-hidden rounded-2xl bg-[#FFF9F4] p-1.5 sm:min-h-40 sm:p-2 md:min-h-48 [&>div]:h-full [&>div]:w-full">
						{forgotAnimationView}
					</div>

					<h2 className="text-base font-bold tracking-tight sm:text-lg">Forgot your password?</h2>
					<p className="mt-1.5 text-sm leading-5 text-[#1D1D1D]/80 sm:text-sm">
						Enter your account email. We will send a reset OTP so you can set a new password securely.
					</p>
				</section>

				<section
					aria-label="Forgot password form"
					className="flex flex-col justify-center rounded-3xl border border-[#1D1D1D]/10 bg-white p-3 shadow-xl shadow-[#1D1D1D]/5 sm:p-3.5"
				>
					<div className="mb-2.5 flex items-center gap-2.5">
						<span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#1D1D1D]/10 bg-white">
							<img src={logo} alt="FairGig logo" className="h-full w-full object-cover" />
						</span>
						<strong className="text-base tracking-wide">FairGig</strong>
					</div>

					<h1 className="text-lg font-black tracking-tight sm:text-xl">Password recovery</h1>
					<p className="mt-1.5 text-sm text-[#1D1D1D]/70">Request a one-time OTP for password reset.</p>

					<form onSubmit={onSubmit} className="mt-3.5 space-y-2.5">
						<ToastOnMessage message={error} tone="error" onShown={clearError} />
						<ToastOnMessage message={notice} tone="success" onShown={() => setNotice('')} />

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

						<button
							type="submit"
							disabled={isLoading}
							className="w-full rounded-xl bg-[#FF914D] px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-95"
						>
							{isLoading ? 'Sending OTP...' : 'Send reset OTP'}
						</button>
					</form>

					<p className="mt-2.5 text-sm text-[#1D1D1D]/75">
						Remember your password?{' '}
						<Link to="/login" className="font-semibold text-[#FF914D] hover:underline">
							Back to login
						</Link>
					</p>
				</section>
			</div>
		</main>
	)
}