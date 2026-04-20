import type { IconName } from '../../types/dashboard'
import { Icon } from '../common/Icon'

interface LandingRoleCardProps {
	role: string
	icon: IconName
	tagline: string
	highlights: string[]
}

export const LandingRoleCard = ({ role, icon, tagline, highlights }: LandingRoleCardProps) => (
	<article className="group rounded-2xl border border-[#1D1D1D]/10 bg-white p-4 shadow-lg shadow-[#1D1D1D]/5 transition hover:-translate-y-0.5 hover:border-[#FF914D]/40 hover:shadow-xl">
		<div className="flex items-center gap-3">
			<span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF4EB] text-[#1D1D1D]">
				<Icon name={icon} className="h-5 w-5" />
			</span>
			<div>
				<h3 className="text-base font-bold tracking-tight">{role}</h3>
				<p className="text-xs text-[#1D1D1D]/65">{tagline}</p>
			</div>
		</div>

		<ul className="mt-4 space-y-2">
			{highlights.map((item) => (
				<li key={item} className="flex items-start gap-2 text-sm text-[#1D1D1D]/80">
					<span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[#FF914D]" aria-hidden="true" />
					<span>{item}</span>
				</li>
			))}
		</ul>
	</article>
)
