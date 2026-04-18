import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLottie } from 'lottie-react'
import signupAnimation from '../animations/Login verification.json'

export const Signup = () => {
	const { View: signupAnimationView } = useLottie({
		animationData: signupAnimation,
		loop: true,
		autoplay: true,
	})

	const navigate = useNavigate()
	const [fullName, setFullName] = useState('')
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [message, setMessage] = useState('')

	const onSubmit = (event: React.FormEvent) => {
		event.preventDefault()

		localStorage.setItem(
			'mailflow_mock_signup',
			JSON.stringify({
				name: fullName || 'New User',
				email,
			}),
		)
		localStorage.setItem('mailflow_auth', 'false')
		setMessage('Mock account created. Please sign in with demo@ecommerce.com / demo123')

		setTimeout(() => navigate('/login'), 900)
	}

	return (
		<main className="relative min-h-screen overflow-hidden bg-[#FFF4EB] text-[#1D1D1D]">
			<div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#FF914D]/20 blur-3xl" />
			<div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#FF914D]/25 blur-3xl" />

			<div className="relative mx-auto grid min-h-screen w-full max-w-6xl grid-cols-1 gap-8 px-4 py-8 sm:px-8 lg:grid-cols-2 lg:gap-10 lg:py-12">
				<section
					aria-label="Onboarding preview"
					className="rounded-3xl border border-[#FF914D]/20 bg-white/80 p-6 shadow-xl shadow-[#FF914D]/10 backdrop-blur-sm sm:p-8"
				>
					<div className="mb-5 rounded-2xl bg-[#FFF9F4] p-4">{signupAnimationView}</div>

					<h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Launch Campaigns Faster</h2>
					<p className="mt-3 text-sm leading-6 text-[#1D1D1D]/80 sm:text-base">
						Create audience segments, schedule sends, and monitor campaign performance from one clean dashboard.
					</p>

					<div className="mt-8 flex items-center gap-3 rounded-xl bg-[#1D1D1D] px-4 py-3 text-white" aria-hidden="true">
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
						<small className="text-xs text-white/90 sm:text-sm">Built for modern growth teams</small>
					</div>
				</section>

				<section
					aria-label="Signup form"
					className="rounded-3xl border border-[#1D1D1D]/10 bg-white p-6 shadow-xl shadow-[#1D1D1D]/5 sm:p-8"
				>
					<div className="mb-6 flex items-center gap-3">
						<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FF914D] text-lg font-bold text-white">
							M
						</span>
						<strong className="text-base tracking-wide">MailFlow</strong>
					</div>

					<h1 className="text-3xl font-black tracking-tight">Create account</h1>
					<p className="mt-2 text-sm text-[#1D1D1D]/70">This screen is mocked for now. No backend calls are made.</p>

					<form onSubmit={onSubmit} className="mt-7 space-y-4">
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
								required
								className="w-full rounded-xl border border-[#1D1D1D]/15 bg-[#FFFCFA] px-4 py-3 text-sm outline-none ring-[#FF914D] transition focus:border-[#FF914D] focus:ring-2"
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
								required
								className="w-full rounded-xl border border-[#1D1D1D]/15 bg-[#FFFCFA] px-4 py-3 text-sm outline-none ring-[#FF914D] transition focus:border-[#FF914D] focus:ring-2"
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
								required
								className="w-full rounded-xl border border-[#1D1D1D]/15 bg-[#FFFCFA] px-4 py-3 text-sm outline-none ring-[#FF914D] transition focus:border-[#FF914D] focus:ring-2"
							/>
						</div>

						{message ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</p> : null}

						<button
							type="submit"
							className="w-full rounded-xl bg-[#FF914D] px-4 py-3 text-sm font-semibold text-white transition hover:brightness-95"
						>
							Create account
						</button>
					</form>

					<p className="mt-6 text-sm text-[#1D1D1D]/75">
						Already have an account?{' '}
						<Link to="/login" className="font-semibold text-[#FF914D] hover:underline">
							Sign in
						</Link>
					</p>

					<p className="mt-8 text-xs text-[#1D1D1D]/50">@ 2026 MailFlow Inc. All rights reserved.</p>
				</section>
			</div>
		</main>
	)
}
