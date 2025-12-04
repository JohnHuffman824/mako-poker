/**
 * Mako shark logo SVG component.
 * Displays the brand shark icon in the top left corner.
 */
export function MakoLogo({ className }: { className?: string }) {
	return (
		<svg
			className={className}
			viewBox="0 0 80 60"
			fill="currentColor"
			xmlns="http://www.w3.org/2000/svg"
		>
			{/* Shark silhouette */}
			<path
				d="M75 30c0-2-8-12-20-15-2-8-8-12-15-12-3 0-5 1-7 3l-5-4c-2-2-5 
					 0-4 3l2 5c-10 2-18 10-22 18-2 4-2 8 0 10 3 4 10 6 18 6h8c10 0 
					 22-3 30-8 8-4 15-6 15-6zm-50-5c-2 0-3-1-3-3s1-3 3-3 3 1 3 3-1 
					 3-3 3zm-8 15c-4 0-7-1-8-3 0-1 0-2 1-4 3-5 8-10 15-13-5 8-7 
					 15-8 20z"
				fillRule="evenodd"
				clipRule="evenodd"
			/>
			{/* Dorsal fin accent */}
			<path
				d="M40 8c2-3 5-5 8-5 0 3-2 7-5 10l-3-5z"
				opacity="0.8"
			/>
		</svg>
	)
}

