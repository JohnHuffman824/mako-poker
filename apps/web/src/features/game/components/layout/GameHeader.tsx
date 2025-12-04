import { LogOut } from 'lucide-react'
import { MakoLogo } from './MakoLogo'

interface GameHeaderProps {
	onLogout: () => void
}

/**
 * Game page header with Mako logo and logout button.
 */
export function GameHeader({ onLogout }: GameHeaderProps) {
	return (
		<header className="absolute top-0 left-0 right-0 z-30">
			<div className="flex justify-between items-start px-2 py-2">
				{/* Mako Logo */}
				<div className="opacity-50">
					<MakoLogo className="w-20 h-16 text-slate-800" />
				</div>

				{/* Logout Button */}
				<button
					onClick={onLogout}
					className="flex items-center gap-2 text-white/60 hover:text-white
										 text-sm transition-colors px-3 py-2"
				>
					<LogOut className="w-4 h-4" />
					Logout
				</button>
			</div>
		</header>
	)
}
