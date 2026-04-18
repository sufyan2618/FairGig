import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLottie } from 'lottie-react'
import loginAnimation from '../animations/Login verification.json'

const MOCK_EMAIL = 'demo@ecommerce.com'
const MOCK_PASSWORD = 'demo123'

export const Login = () => {
	const { View: loginAnimationView } = useLottie({
		animationData: loginAnimation,
		loop: true,
		autoplay: true,
	})

	const navigate = useNavigate()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [remember, setRemember] = useState(false)
	const [error, setError] = useState('')

	const onSubmit = (event: React.FormEvent) => {
		event.preventDefault()
		setError('')

		if (email !== MOCK_EMAIL || password !== MOCK_PASSWORD) {
			setError('Invalid credentials. Use demo@ecommerce.com / demo123')
			return
		}

		localStorage.setItem('mailflow_auth', 'true')
		localStorage.setItem('mailflow_user', JSON.stringify({ name: 'Demo User', email: MOCK_EMAIL }))

		if (remember) {
			localStorage.setItem('mailflow_remember', 'true')
		} else {
			localStorage.removeItem('mailflow_remember')
		}

		navigate('/dashboard')
	}

	return (
		<main className="relative min-h-screen overflow-hidden bg-[#FFF4EB] text-[#1D1D1D]">
			<div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#FF914D]/20 blur-3xl" />
			<div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#FF914D]/25 blur-3xl" />

			<div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-8 lg:grid-cols-2 lg:gap-10 lg:py-12">
				<section
					aria-label="Product preview"
					className="rounded-3xl border border-[#FF914D]/20 bg-white/80 p-6 shadow-xl shadow-[#FF914D]/10 backdrop-blur-sm sm:p-8"
				>
					<div className="mb-5 rounded-2xl bg-[#FFF9F4] p-4">{loginAnimationView}</div>

					<h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Analyze Your Reach</h2>
					<p className="mt-3 text-sm leading-6 text-[#1D1D1D]/80 sm:text-base">
						Connect with your audience using our powerful email analytics engine. Track opens, clicks, and
						conversions in real-time.
					</p>

					<div className="mt-8 flex items-center gap-3 rounded-xl bg-[#1D1D1D] px-4 py-3 text-white" aria-hidden="true">
						<div className="-space-x-2">
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-[#FF914D] text-xs font-semibold">
								J
							</span>
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-[#F9703E] text-xs font-semibold">
								A
							</span>
							<span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/70 bg-[#E85D2F] text-xs font-semibold">
								M
							</span>
						</div>
						<small className="text-xs text-white/90 sm:text-sm">Trusted by 10,000+ marketers</small>
					</div>
				</section>

				<section
					aria-label="Login form"
					className="rounded-3xl border border-[#1D1D1D]/10 bg-white p-6 shadow-xl shadow-[#1D1D1D]/5 sm:p-8"
				>
					<div className="mb-6 flex items-center gap-3">
						<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF914D] text-lg font-bold text-white">
							M
						</span>
						<strong className="text-base tracking-wide">MailFlow</strong>
					</div>

					<h1 className="text-3xl font-black tracking-tight">Welcome back</h1>
					<p className="mt-2 text-sm text-[#1D1D1D]/70">Please enter your details to sign in.</p>

					<form onSubmit={onSubmit} className="mt-7 space-y-4">
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
								required
								className="w-full rounded-xl border border-[#1D1D1D]/15 bg-[#FFFCFA] px-4 py-3 text-sm outline-none ring-[#FF914D] transition focus:border-[#FF914D] focus:ring-2"
							/>
						</div>

						<div className="space-y-2">
							<div className="flex items-center justify-between">
								<label className="text-sm font-medium" htmlFor="password">
									Password
								</label>
								<Link to="/forgot-password" className="text-xs font-medium text-[#FF914D] hover:underline">
									Forgot password?
								</Link>
							</div>

							<input
								id="password"
								type="password"
								placeholder="Enter your password"
								value={password}
								onChange={(event) => setPassword(event.target.value)}
								required
								className="w-full rounded-xl border border-[#1D1D1D]/15 bg-[#FFFCFA] px-4 py-3 text-sm outline-none ring-[#FF914D] transition focus:border-[#FF914D] focus:ring-2"
							/>
						</div>

						<label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#1D1D1D]/80" htmlFor="rememberMe">
							<input
								id="rememberMe"
								type="checkbox"
								checked={remember}
								onChange={(event) => setRemember(event.target.checked)}
								className="h-4 w-4 rounded border-[#1D1D1D]/20 text-[#FF914D] focus:ring-[#FF914D]"
							/>
							<span>Remember me for 30 days</span>
						</label>

						{error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p> : null}

						<button
							type="submit"
							className="w-full rounded-xl bg-[#FF914D] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-95"
						>
							Sign in
						</button>

						<div className="flex items-center gap-3 py-1">
							<span className="h-px flex-1 bg-[#1D1D1D]/15" />
							<small className="text-xs text-[#1D1D1D]/60">Or continue with</small>
							<span className="h-px flex-1 bg-[#1D1D1D]/15" />
						</div>

						<div className="grid grid-cols-2 gap-3" aria-hidden="true">
							<button
								type="button"
								className="rounded-xl border border-[#1D1D1D]/15 bg-white px-4 py-2.5 text-sm font-medium hover:bg-[#FFF7F0]"
							>
								Google
							</button>
							<button
								type="button"
								className="rounded-xl border border-[#1D1D1D]/15 bg-[#1D1D1D] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#2B2B2B]"
							>
								GitHub
							</button>
						</div>
					</form>

					<p className="mt-6 text-sm text-[#1D1D1D]/75">
						Don&apos;t have an account?{' '}
						<Link to="/signup" className="font-semibold text-[#FF914D] hover:underline">
							Sign up for free
						</Link>
					</p>

					<p className="mt-8 text-xs text-[#1D1D1D]/50">@ 2026 MailFlow Inc. All rights reserved.</p>
				</section>
			</div>
		</main>
	)
}
