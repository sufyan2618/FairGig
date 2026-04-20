import { Link } from 'react-router-dom'
import logo from '../assets/logo.jpeg'
import manWithTaskListAnimation from '../animations/Man with task list (1).json'
import { Icon } from '../components/common/Icon'
import { LandingAnimationCard } from '../components/landing/LandingAnimationCard'
import { LandingFeatureCard } from '../components/landing/LandingFeatureCard'
import { LandingRoleCard } from '../components/landing/LandingRoleCard'
import { LandingSectionHeading } from '../components/landing/LandingSectionHeading'
import { LandingWorkflowStep } from '../components/landing/LandingWorkflowStep'

const featureItems = [
	{
		title: 'Daily earnings that are easy to read',
		description: 'Capture shift records and see net trends without spreadsheet cleanup or delayed exports.',
		icon: <Icon name="wallet" className="h-5 w-5" />,
	},
	{
		title: 'Verification flow with fewer bottlenecks',
		description: 'Move worker records through clear checkpoints so approval and dispute handling stay transparent.',
		icon: <Icon name="chart" className="h-5 w-5" />,
	},
	{
		title: 'Built for worker, verifier, advocate roles',
		description: 'Each dashboard is role-scoped so teams focus on tasks that match their responsibilities.',
		icon: <Icon name="team" className="h-5 w-5" />,
	},
]

const roleItems = [
	{
		role: 'Worker',
		icon: 'wallet' as const,
		tagline: 'Daily visibility over your effort and payouts',
		highlights: ['Log shifts with timestamps', 'Track weekly earnings', 'Raise grievances with context'],
	},
	{
		role: 'Verifier',
		icon: 'chart' as const,
		tagline: 'Structured queues for confident approvals',
		highlights: ['Review pending submissions', 'Verify evidence in one flow', 'Maintain transparent history'],
	},
	{
		role: 'Advocate',
		icon: 'team' as const,
		tagline: 'Analytics to surface risk before escalation',
		highlights: ['Track commission patterns', 'Spot vulnerability flags', 'Moderate grievance trends'],
	},
]

const workflowItems = [
	{
		step: 'Step 01',
		title: 'Capture work records',
		description: 'Workers log shifts, upload proofs, and build a reliable earnings timeline.',
	},
	{
		step: 'Step 02',
		title: 'Verify with confidence',
		description: 'Verifiers process queues with consistent checks and traceable outcomes.',
	},
	{
		step: 'Step 03',
		title: 'Act on insights',
		description: 'Advocates monitor analytics and intervene earlier when patterns look unfair.',
	},
]

const moduleHighlights = [
	'Log Shift',
	'My Earnings',
	'Upload Screenshots',
	'Income Certificate',
	'Verification Queue',
	'Verified History',
	'Commission Tracker',
	'Vulnerability Flags',
	'Complaint Analytics',
]

const LandingPage = () => (
	<main className="relative min-h-dvh overflow-hidden bg-[#FFF4EB] text-[#1D1D1D]">
		<div className="pointer-events-none absolute -left-16 top-12 h-56 w-56 rounded-full bg-[#FF914D]/20 blur-3xl" />
		<div className="pointer-events-none absolute -right-20 top-1/3 h-64 w-64 rounded-full bg-[#FF914D]/20 blur-3xl" />
		<div className="pointer-events-none absolute bottom-0 left-1/3 h-44 w-44 rounded-full bg-[#1D1D1D]/10 blur-3xl" />

		<header className="fixed inset-x-0 top-0 z-50 animate-fade-in border-b border-[#1D1D1D]/10 bg-[#FFF4EB]/85 backdrop-blur-md">
			<div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-transparent via-[#FF914D]/50 to-transparent" />
			<div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
				<Link to="/" className="flex items-center gap-2.5" aria-label="Go to home">
						<span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl border border-[#1D1D1D]/10 bg-white">
							<img src={logo} alt="FairGig logo" className="h-full w-full object-cover" />
						</span>
						<div>
							<strong className="block text-base tracking-wide">FairGig</strong>
							<small className="text-xs text-[#1D1D1D]/60">Fair earnings infrastructure</small>
						</div>
					</Link>

					<nav className="flex items-center gap-2">
						<Link
							to="/login"
							className="rounded-xl border border-[#1D1D1D]/20 bg-white/80 px-3 py-2 text-sm font-medium transition hover:bg-white"
						>
							Sign in
						</Link>
						<Link
							to="/signup"
							className="rounded-xl bg-[#FF914D] px-3 py-2 text-sm font-semibold text-white shadow-lg shadow-[#FF914D]/30 transition hover:-translate-y-0.5 hover:brightness-95"
						>
							Create account
						</Link>
					</nav>
			</div>
		</header>

		<div className="relative mx-auto flex w-full max-w-6xl flex-col gap-12 px-4 pb-6 pt-24 sm:px-6 sm:pt-28 lg:px-8 lg:pb-8 lg:pt-30">

			<section className="grid items-center gap-6 lg:grid-cols-[1.15fr_0.85fr]">
				<div className="animate-fade-up">
					<p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A4B23]">Transparent work records</p>
					<h1 className="mt-3 text-3xl font-black leading-tight tracking-tight sm:text-4xl lg:text-5xl">
						One workspace for fair pay, fast verification, and accountable support.
					</h1>
					<p className="mt-4 max-w-xl text-sm leading-7 text-[#1D1D1D]/75 sm:text-base">
						FairGig helps teams track earnings, verify submissions, and surface anomalies early. The same platform
						serves workers, verifiers, and advocates through a unified workflow.
					</p>

					<div className="mt-6 flex flex-wrap items-center gap-3">
						<Link
							to="/signup"
							className="rounded-xl bg-[#1D1D1D] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-black"
						>
							Start with free signup
						</Link>
						<Link
							to="/login"
							className="rounded-xl border border-[#FF914D]/40 bg-white px-4 py-2.5 text-sm font-semibold text-[#8A4B23] transition hover:border-[#FF914D]"
						>
							I already have an account
						</Link>
					</div>

					<div className="mt-6 flex flex-wrap gap-2">
						<span className="rounded-full border border-[#1D1D1D]/15 bg-white px-3 py-1 text-xs font-medium">
							Worker dashboard
						</span>
						<span className="rounded-full border border-[#1D1D1D]/15 bg-white px-3 py-1 text-xs font-medium">
							Verifier queue
						</span>
						<span className="rounded-full border border-[#1D1D1D]/15 bg-white px-3 py-1 text-xs font-medium">
							Advocate analytics
						</span>
					</div>
				</div>

				<div className="grid gap-3">
					<LandingAnimationCard
						title="Task-focused onboarding"
						description="A guided checklist experience that helps workers complete core setup and start logging shifts quickly."
						animationData={manWithTaskListAnimation}
						cardClassName="p-5 sm:p-6"
						animationContainerClassName="h-56 sm:h-72"
					/>
				</div>
			</section>

			<section className="relative overflow-hidden rounded-2xl border border-[#1D1D1D]/10 bg-[#1D1D1D] px-4 py-5 text-white shadow-xl shadow-black/20 sm:px-6">
				<div className="pointer-events-none absolute -right-12 -top-10 h-36 w-36 rounded-full bg-[#FF914D]/30 blur-2xl" />
				<div className="pointer-events-none absolute -left-16 bottom-0 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
				<div className="relative grid gap-4 sm:grid-cols-3">
					<div className="animate-fade-up">
						<p className="text-xs uppercase tracking-[0.2em] text-white/65">Live records</p>
						<p className="mt-1 text-2xl font-black text-[#FFB07B]">24h</p>
						<p className="text-sm text-white/80">Shift and earnings visibility</p>
					</div>
					<div className="animate-fade-up [animation-delay:80ms]">
						<p className="text-xs uppercase tracking-[0.2em] text-white/65">Role-ready workflows</p>
						<p className="mt-1 text-2xl font-black text-[#FFB07B]">3 lanes</p>
						<p className="text-sm text-white/80">Worker, verifier, advocate</p>
					</div>
					<div className="animate-fade-up [animation-delay:160ms]">
						<p className="text-xs uppercase tracking-[0.2em] text-white/65">Actionable intelligence</p>
						<p className="mt-1 text-2xl font-black text-[#FFB07B]">Early</p>
						<p className="text-sm text-white/80">Signals before disputes escalate</p>
					</div>
				</div>
			</section>

			<section className="space-y-6">
				<LandingSectionHeading
					eyebrow="Core capabilities"
					title="Reusable building blocks for operations teams"
					description="From logging shifts to reviewing disputes, the platform keeps data and actions in one coherent loop."
				/>

				<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
					{featureItems.map((feature) => (
						<LandingFeatureCard
							key={feature.title}
							title={feature.title}
							description={feature.description}
							icon={feature.icon}
						/>
					))}
				</div>
			</section>

			<section className="space-y-6">
				<LandingSectionHeading
					eyebrow="Role-specific"
					title="Designed for every decision-maker in the flow"
					description="Each role gets focused tools without losing shared context across records, verification, and resolution."
				/>

				<div className="grid gap-4 lg:grid-cols-3">
					{roleItems.map((role, index) => (
						<div key={role.role} className={index === 1 ? 'animate-fade-up [animation-delay:120ms]' : index === 2 ? 'animate-fade-up [animation-delay:220ms]' : 'animate-fade-up'}>
							<LandingRoleCard
								role={role.role}
								icon={role.icon}
								tagline={role.tagline}
								highlights={role.highlights}
							/>
						</div>
					))}
				</div>
			</section>

			<section className="space-y-6">
				<LandingSectionHeading
					eyebrow="How it works"
					title="A clear three-step cycle"
					description="Teams stay aligned when collection, verification, and intervention happen in one connected rhythm."
				/>

				<div className="grid gap-4 md:grid-cols-3">
					{workflowItems.map((item, index) => (
						<LandingWorkflowStep
							key={item.step}
							step={item.step}
							title={item.title}
							description={item.description}
							delayClassName={index === 0 ? '' : index === 1 ? '[animation-delay:100ms]' : '[animation-delay:180ms]'}
						/>
					))}
				</div>
			</section>

			<section className="overflow-hidden rounded-2xl border border-[#FF914D]/25 bg-white/80 p-4 shadow-lg shadow-[#FF914D]/10 backdrop-blur-sm sm:p-5">
				<p className="text-center text-xs font-semibold uppercase tracking-[0.22em] text-[#8A4B23]">Module highlights</p>
				<div className="landing-scroll-track mt-4">
					<div className="landing-scroll-content">
						{moduleHighlights.map((label) => (
							<span key={label} className="inline-flex min-w-fit rounded-full border border-[#1D1D1D]/15 bg-white px-3 py-1.5 text-xs font-medium text-[#1D1D1D]">
								{label}
							</span>
						))}
						{moduleHighlights.map((label, index) => (
							<span key={`${label}-${index}`} className="inline-flex min-w-fit rounded-full border border-[#1D1D1D]/15 bg-white px-3 py-1.5 text-xs font-medium text-[#1D1D1D]">
								{label}
							</span>
						))}
					</div>
				</div>
			</section>

			<section className="animate-fade-up rounded-2xl border border-[#FF914D]/25 bg-white/85 p-5 text-center shadow-xl shadow-[#FF914D]/10 backdrop-blur-sm sm:p-6">
				<p className="text-sm font-semibold uppercase tracking-[0.2em] text-[#8A4B23]">Ready to launch</p>
				<h2 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">Bring your team into FairGig today</h2>
				<p className="mx-auto mt-3 max-w-2xl text-sm leading-6 text-[#1D1D1D]/70 sm:text-base">
					Create an account in minutes and switch from scattered records to role-based dashboards that are easier to
					trust.
				</p>
				<div className="mt-5 flex flex-wrap items-center justify-center gap-3">
					<Link to="/signup" className="rounded-xl bg-[#FF914D] px-4 py-2.5 text-sm font-semibold text-white transition hover:brightness-95">
						Get started
					</Link>
					<Link to="/login" className="rounded-xl border border-[#1D1D1D]/20 bg-white px-4 py-2.5 text-sm font-semibold transition hover:bg-[#FFF8F2]">
						Go to login
					</Link>
				</div>
			</section>
		</div>

		<footer className="relative overflow-hidden border-t border-[#1D1D1D]/10 bg-[#1D1D1D] text-white">
			<div className="pointer-events-none absolute -left-14 top-1/2 h-44 w-44 rounded-full bg-[#FF914D]/15 blur-3xl" />
			<div className="pointer-events-none absolute -right-10 top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

			<div className="relative mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
				<div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr_1fr]">
					<section className="space-y-4">
					

						<p className="max-w-md text-sm leading-6 text-white/75">
							From shift logs and verification queues to vulnerability flags, FairGig keeps worker records, review
							decisions, and advocacy actions in one connected flow.
						</p>

						<div className="grid gap-2 sm:grid-cols-3">
							{workflowItems.map((item) => (
								<div key={item.step} className="rounded-xl border border-white/15 bg-white/5 p-2.5">
									<p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#FFB07B]">{item.step}</p>
									<p className="mt-1 text-xs font-semibold text-white">{item.title}</p>
								</div>
							))}
						</div>
					</section>

					<section>
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFB07B]">Role lanes</p>
						<ul className="mt-3 space-y-2.5">
							{roleItems.map((role) => (
								<li key={role.role} className="rounded-xl border border-white/15 bg-white/5 px-3 py-2.5">
									<p className="text-sm font-semibold text-white">{role.role}</p>
									<p className="mt-1 text-xs text-white/70">{role.tagline}</p>
								</li>
							))}
						</ul>
					</section>

					<section>
						<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFB07B]">Module highlights</p>
						<div className="mt-3 flex flex-wrap gap-2">
							{moduleHighlights.map((label) => (
								<span
									key={label}
									className="inline-flex min-w-fit rounded-full border border-white/20 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white"
								>
									{label}
								</span>
							))}
						</div>
					</section>
				</div>

				<div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-4 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
					<p>Copyright 2026 FairGig Inc. Built for transparent earnings workflows.</p>
					
				</div>
			</div>
		</footer>
	</main>
)

export default LandingPage
