interface LandingWorkflowStepProps {
	step: string
	title: string
	description: string
	delayClassName?: string
}

export const LandingWorkflowStep = ({
	step,
	title,
	description,
	delayClassName = '',
}: LandingWorkflowStepProps) => (
	<article className={`rounded-2xl border border-[#FF914D]/20 bg-white/90 p-4 shadow-lg shadow-[#FF914D]/10 backdrop-blur-sm animate-fade-up ${delayClassName}`}>
		<p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8A4B23]">{step}</p>
		<h3 className="mt-2 text-base font-bold tracking-tight text-[#1D1D1D]">{title}</h3>
		<p className="mt-2 text-sm leading-6 text-[#1D1D1D]/75">{description}</p>
	</article>
)
