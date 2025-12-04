interface ErrorToastProps {
	message: string
	onDismiss: () => void
}

/**
 * Error toast notification.
 */
export function ErrorToast({ message, onDismiss }: ErrorToastProps) {
	return (
		<div className="absolute top-16 left-1/2 -translate-x-1/2 z-50
										bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg
										flex items-center gap-3">
			<span>{message}</span>
			<button
				onClick={onDismiss}
				className="text-white/80 hover:text-white"
				aria-label="Dismiss error"
			>
				✕
			</button>
		</div>
	)
}

