import { ReactNode } from 'react'
import {
	useViewportScale,
	DESIGN_WIDTH,
	DESIGN_HEIGHT,
} from '../../hooks/useViewportScale'

interface ScaledContainerProps {
	children: ReactNode
}

/**
 * Container that scales its children to fit the viewport.
 * Uses CSS transform to scale from design resolution to actual viewport.
 * Children can use fixed pixel values based on DESIGN_WIDTH x DESIGN_HEIGHT.
 */
export function ScaledContainer({ children }: ScaledContainerProps) {
	const { scale } = useViewportScale()

	return (
		<div className="w-screen h-screen flex items-center justify-center overflow-hidden">
			<div
				style={{
					width: DESIGN_WIDTH,
					height: DESIGN_HEIGHT,
					transform: `scale(${scale})`,
					transformOrigin: 'center center',
				}}
				className="relative"
			>
				{children}
			</div>
		</div>
	)
}

