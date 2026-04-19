interface LandingSectionHeadingProps {
	eyebrow: string
	title: string
	description: string
}

export const LandingSectionHeading = ({ eyebrow, title, description }: LandingSectionHeadingProps) => (
	<header className="mx-auto max-w-2xl text-center">
		<p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#8A4B23]">{eyebrow}</p>
		<h2 className="mt-2 text-2xl font-black tracking-tight text-[#1D1D1D] sm:text-3xl">{title}</h2>
		<p className="mt-3 text-sm leading-6 text-[#1D1D1D]/70 sm:text-base">{description}</p>
	</header>
)
