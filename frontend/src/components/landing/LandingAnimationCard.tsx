import { useLottie } from 'lottie-react'

interface LandingAnimationCardProps {
	title: string
	description: string
	animationData: object
	delayClassName?: string
	cardClassName?: string
	animationContainerClassName?: string
}

export const LandingAnimationCard = ({
	title,
	description,
	animationData,
	delayClassName = '',
	cardClassName = '',
	animationContainerClassName = 'h-28',
}: LandingAnimationCardProps) => {
	const { View } = useLottie({
		animationData,
		loop: true,
		autoplay: true,
	})

	return (
		<article
			className={`rounded-2xl border border-[#FF914D]/20 bg-white/90 p-4 shadow-xl shadow-[#FF914D]/10 backdrop-blur-sm animate-fade-up animate-drift ${delayClassName} ${cardClassName}`}
		>
			<div className={`mb-3 overflow-hidden rounded-xl bg-[#FFF8F2] [&>div]:h-full [&>div]:w-full ${animationContainerClassName}`}>{View}</div>
			<h3 className="text-sm font-bold text-[#1D1D1D]">{title}</h3>
			<p className="mt-1 text-xs leading-5 text-[#1D1D1D]/70">{description}</p>
		</article>
	)
}
