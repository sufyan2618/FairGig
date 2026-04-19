import type { ReactNode } from 'react'

interface LandingFeatureCardProps {
	title: string
	description: string
	icon: ReactNode
}

export const LandingFeatureCard = ({ title, description, icon }: LandingFeatureCardProps) => (
	<article className="rounded-2xl border border-[#1D1D1D]/10 bg-white/90 p-4 shadow-lg shadow-[#1D1D1D]/5 backdrop-blur-sm transition hover:-translate-y-0.5 hover:shadow-xl">
		<div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-[#FFF4EB] text-[#1D1D1D]">{icon}</div>
		<h3 className="text-base font-bold tracking-tight text-[#1D1D1D]">{title}</h3>
		<p className="mt-1.5 text-sm leading-6 text-[#1D1D1D]/75">{description}</p>
	</article>
)
