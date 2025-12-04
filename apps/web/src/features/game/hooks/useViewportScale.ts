import { useState, useEffect, useCallback } from 'react'

/**
 * Design dimensions - the base resolution we design for.
 * All UI elements are positioned/sized relative to this.
 */
const DESIGN_WIDTH = 1440
const DESIGN_HEIGHT = 900

interface ViewportScale {
	scale: number
	width: number
	height: number
}

/**
 * Hook that calculates the scale factor to fit the design viewport
 * into the current window while maintaining aspect ratio.
 * Uses the smaller of width/height ratios to ensure nothing overflows.
 */
export function useViewportScale(): ViewportScale {
	const calculateScale = useCallback((): ViewportScale => {
		const windowWidth = window.innerWidth
		const windowHeight = window.innerHeight

		const scaleX = windowWidth / DESIGN_WIDTH
		const scaleY = windowHeight / DESIGN_HEIGHT
		const scale = Math.min(scaleX, scaleY)

		return {
			scale,
			width: DESIGN_WIDTH,
			height: DESIGN_HEIGHT,
		}
	}, [])

	const [viewport, setViewport] = useState<ViewportScale>(calculateScale)

	useEffect(() => {
		function handleResize() {
			setViewport(calculateScale())
		}

		window.addEventListener('resize', handleResize)
		handleResize()

		return () => window.removeEventListener('resize', handleResize)
	}, [calculateScale])

	return viewport
}

export { DESIGN_WIDTH, DESIGN_HEIGHT }

