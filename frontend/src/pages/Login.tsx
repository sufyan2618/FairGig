import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useLottie } from 'lottie-react'
import loginAnimation from '../animations/Login verification.json'
import logo from '../assets/logo.jpeg'
import { ToastOnMessage } from '../components/common/ToastOnMessage'
import { useAuthApi } from '../hooks/api/useAuthApi'
import { getHomeRouteForRole } from '../utils/auth'

export const Login = () => {
	const { View: loginAnimationView } = useLottie({
		animationData: loginAnimation,
		loop: true,
		autoplay: true,
	})

	const navigate = useNavigate()
	const { login, setRememberMe, rememberMe, isLoading, error, clearError } = useAuthApi()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault()
		clearError()

		try {
			const response = await login({
				email: email.trim().toLowerCase(),
				password,
			})

			navigate(getHomeRouteForRole(response.user.role), {
				replace: true,
				state: {},
			})
		} catch {
			return
		}
	}

	return (
		<main className="auth-viewport relative min-h-dvh bg-[#FFF4EB] text-[#1D1D1D]">
			<div className="pointer-events-none absolute -left-20 top-10 h-64 w-64 rounded-full bg-[#FF914D]/20 blur-3xl" />
			<div className="pointer-events-none absolute -right-24 bottom-0 h-72 w-72 rounded-full bg-[#FF914D]/25 blur-3xl" />

			<header className="relative z-20 border-b border-[#1D1D1D]/10 bg-[#FFF4EB]/90 backdrop-blur-md">
				<div className="mx-auto flex w-full max-w-4xl items-center justify-between px-3 py-2.5 sm:px-4">
					<Link to="/" className="flex items-center gap-2.5">
						<span className="inline-flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-[#1D1D1D]/10 bg-white">
							<img src={logo} alt="FairGig logo" className="h-full w-full object-cover" />
						</span>
						<strong className="text-sm tracking-wide">FairGig</strong>
					</Link>
					<nav className="flex items-center gap-2">
						<Link to="/signup" className="rounded-lg bg-[#FF914D] px-2.5 py-1.5 text-xs font-semibold text-white transition hover:brightness-95">
							Create account
						</Link>
					</nav>
				</div>
			</header>

			<div className="auth-content relative mx-auto grid w-full max-w-4xl grid-cols-1 items-start gap-2.5 px-3 py-2 sm:px-4 md:grid-cols-2 md:items-stretch md:gap-2.5 lg:gap-3 lg:py-2">
				<section
					aria-label="Product preview"
					className="flex flex-col rounded-3xl border border-[#FF914D]/20 bg-white/80 p-3 shadow-xl shadow-[#FF914D]/10 backdrop-blur-sm sm:p-3.5"
				>
					<div className="mb-2 flex min-h-32 items-center justify-center overflow-hidden rounded-2xl bg-[#FFF9F4] p-1.5 sm:min-h-40 sm:p-2 md:min-h-48 [&>div]:h-full [&>div]:w-full">
						{loginAnimationView}
					</div>

					<h2 className="text-center text-base font-bold tracking-tight sm:text-lg">Analyze Your Reach</h2>
					<p className="mt-1.5 text-sm leading-5 text-[#1D1D1D]/80 sm:text-sm">
						Track verified earnings, detect unusual deductions, and keep your livelihood records organized in one
						place.
					</p>
				</section>

				<section
					aria-label="Login form"
					className="flex flex-col justify-center rounded-3xl border border-[#1D1D1D]/10 bg-white p-3 shadow-xl shadow-[#1D1D1D]/5 sm:p-3.5"
				>
					<div className="mb-2.5 flex items-center justify-center gap-2.5 text-center">
						<span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#1D1D1D]/10 bg-white">
							<img src={logo} alt="FairGig logo" className="h-full w-full object-cover" />
						</span>
						<strong className="text-base tracking-wide">FairGig</strong>
					</div>

					<h1 className="text-center text-lg font-black tracking-tight sm:text-xl">Welcome back</h1>
					<p className="mt-1.5 text-center text-sm text-[#1D1D1D]/70">Sign in to continue to your FairGig dashboard.</p>

					<form onSubmit={onSubmit} className="mt-3.5 space-y-2.5">
						<ToastOnMessage message={error} tone="error" onShown={clearError} />

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
								autoComplete="current-password"
								required
								className="w-full rounded-xl border border-[#1D1D1D]/15 bg-[#FFFCFA] px-3.5 py-2 text-sm outline-none ring-[#FF914D] transition focus:border-[#FF914D] focus:ring-2"
							/>
						</div>

						<label className="flex cursor-pointer items-center gap-2.5 text-sm text-[#1D1D1D]/80" htmlFor="rememberMe">
							<input
								id="rememberMe"
								type="checkbox"
								checked={rememberMe}
								onChange={(event) => setRememberMe(event.target.checked)}
								className="h-4 w-4 rounded border-[#1D1D1D]/20 text-[#FF914D] focus:ring-[#FF914D]"
							/>
							<span>Remember me for 30 days</span>
						</label>

						<button
							type="submit"
							disabled={isLoading}
							className="w-full rounded-xl bg-[#FF914D] px-3.5 py-2 text-sm font-semibold text-white transition hover:brightness-95"
						>
							{isLoading ? 'Signing in...' : 'Sign in'}
						</button>

						<p className="rounded-xl border border-[#FF914D]/20 bg-[#FFF8F2] px-3 py-2 text-xs text-[#8A4B23]">
							Use the same email and password you registered with. If your access token expires, FairGig refreshes
							it automatically during active sessions.
						</p>
					</form>

					<p className="mt-2.5 text-center text-sm text-[#1D1D1D]/75">
						Don&apos;t have an account?{' '}
						<Link to="/signup" className="font-semibold text-[#FF914D] hover:underline">
							Sign up for free
						</Link>
					</p>

					<p className="mt-3 text-center text-xs text-[#1D1D1D]/50">@ 2026 FairGig Inc. All rights reserved.</p>
				</section>
			</div>
		</main>
	)
}
