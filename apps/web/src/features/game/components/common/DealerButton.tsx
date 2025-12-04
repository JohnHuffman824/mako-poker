import { CSSProperties } from 'react'

interface DealerButtonProps {
	style?: CSSProperties
}

/**
 * Large dealer position marker - exact Figma design.
 * 80x80px white circle with "D" text.
 */
export function DealerButton({ style }: DealerButtonProps) {
	return (
		<div
			style={style}
			className="w-20 h-20 p-2.5 bg-white rounded-[80px]
								 outline outline-1 outline-offset-[-1px] outline-black
								 inline-flex flex-col justify-center items-center gap-2.5"
		>
			<div
				className="text-center justify-center text-black text-5xl
									 font-normal font-sf-compact"
			>
				D
			</div>
		</div>
	)
}

interface ButtonMarkerProps {
	style?: CSSProperties
}

/**
 * Small button marker - exact Figma design.
 * 28x28px white circle with "B" text.
 */
export function ButtonMarker({ style }: ButtonMarkerProps) {
	return (
		<div
			style={style}
			className="w-7 h-7 p-2.5 bg-white rounded-[80px]
								 outline outline-2 outline-offset-[-2px] outline-black
								 inline-flex flex-col justify-center items-center gap-2.5"
		>
			<div
				className="text-center justify-center text-black text-2xl
									 font-normal font-sf-compact"
			>
				B
			</div>
		</div>
	)
}
