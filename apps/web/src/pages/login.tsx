import { useState } from 'react'
import { useLocation } from 'wouter'
import { api } from '@/api/client'
import { cn } from '@/lib/utils'
import { Spade, User, Lock, Loader2 } from 'lucide-react'

/**
 * Test users for development.
 */
const TEST_USERS = [
	{ email: 'player1@makopoker.com', password: 'TestPass123', name: 'Player One' },
	{ email: 'player2@makopoker.com', password: 'TestPass123', name: 'Player Two' },
	{ email: 'player3@makopoker.com', password: 'TestPass123', name: 'Player Three' },
]

/**
 * Login page with test user selection.
 */
export function LoginPage() {
	const [, setLocation] = useLocation()
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [error, setError] = useState<string | null>(null)

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault()
		if (!email || !password) return

		setIsLoading(true)
		setError(null)

		try {
			const result = await api.login({ email, password })
			api.setToken(result.token)
			setLocation('/game')
		} catch (err) {
			// If login fails, try to register as a new test user
			try {
				const result = await api.register({
					email,
					password,
					displayName: email.split('@')[0],
				})
				api.setToken(result.token)
				setLocation('/game')
			} catch (registerErr) {
				setError('Login failed. Please check your credentials.')
			}
		} finally {
			setIsLoading(false)
		}
	}

	const handleTestUserSelect = (testUser: typeof TEST_USERS[0]) => {
		setEmail(testUser.email)
		setPassword(testUser.password)
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-slate-800 to-slate-900
										flex items-center justify-center p-4">
			{/* Background decoration */}
			<div className="absolute inset-0 overflow-hidden">
				<div className="absolute top-1/4 left-1/4 w-96 h-96 
												bg-emerald-900/20 rounded-full blur-3xl" />
				<div className="absolute bottom-1/4 right-1/4 w-96 h-96 
												bg-blue-900/20 rounded-full blur-3xl" />
			</div>

			<div className="relative w-full max-w-md">
				{/* Logo/Header */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 
													bg-emerald-600 rounded-2xl mb-4 shadow-lg">
						<Spade className="w-8 h-8 text-white" />
					</div>
					<h1 className="text-3xl font-bold text-white mb-2">
						Mako Poker
					</h1>
					<p className="text-gray-400">
						Dominate the table like a shark
					</p>
				</div>

				{/* Login form */}
				<div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-8 
												shadow-2xl border border-slate-700/50">
					<form onSubmit={handleLogin} className="space-y-6">
						{/* Email field */}
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Email
							</label>
							<div className="relative">
								<User className="absolute left-3 top-1/2 -translate-y-1/2 
																 w-5 h-5 text-gray-500" />
								<input
									type="email"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									placeholder="Enter your email"
									className="w-full pl-10 pr-4 py-3 bg-slate-900/50 
														 border border-slate-600 rounded-lg
														 text-white placeholder-gray-500
														 focus:outline-none focus:ring-2 focus:ring-emerald-500
														 focus:border-transparent transition-all"
								/>
							</div>
						</div>

						{/* Password field */}
						<div>
							<label className="block text-sm font-medium text-gray-300 mb-2">
								Password
							</label>
							<div className="relative">
								<Lock className="absolute left-3 top-1/2 -translate-y-1/2 
																 w-5 h-5 text-gray-500" />
								<input
									type="password"
									value={password}
									onChange={(e) => setPassword(e.target.value)}
									placeholder="Enter your password"
									className="w-full pl-10 pr-4 py-3 bg-slate-900/50 
														 border border-slate-600 rounded-lg
														 text-white placeholder-gray-500
														 focus:outline-none focus:ring-2 focus:ring-emerald-500
														 focus:border-transparent transition-all"
								/>
							</div>
						</div>

						{/* Error message */}
						{error && (
							<div className="bg-red-500/10 border border-red-500/50 
															rounded-lg p-3 text-red-400 text-sm">
								{error}
							</div>
						)}

						{/* Submit button */}
						<button
							type="submit"
							disabled={isLoading || !email || !password}
							className={cn(
								'w-full py-3 rounded-lg font-semibold text-white',
								'bg-emerald-600 hover:bg-emerald-500 transition-all',
								'disabled:opacity-50 disabled:cursor-not-allowed',
								'flex items-center justify-center gap-2'
							)}
						>
							{isLoading ? (
								<>
									<Loader2 className="w-5 h-5 animate-spin" />
									Signing in...
								</>
							) : (
								'Sign In'
							)}
						</button>
					</form>

					{/* Test users section */}
					<div className="mt-8 pt-6 border-t border-slate-700">
						<p className="text-sm text-gray-400 text-center mb-4">
							Quick login with test accounts
						</p>
						<div className="grid grid-cols-3 gap-2">
							{TEST_USERS.map((user, index) => (
								<button
									key={user.email}
									onClick={() => handleTestUserSelect(user)}
									className={cn(
										'py-2 px-3 rounded-lg text-sm font-medium transition-all',
										'bg-slate-700/50 hover:bg-slate-600/50',
										'text-gray-300 hover:text-white',
										'border border-slate-600/50'
									)}
								>
									User {index + 1}
								</button>
							))}
						</div>
					</div>
				</div>

				{/* Footer note */}
				<p className="text-center text-gray-500 text-sm mt-6">
					New users will be automatically registered
				</p>
			</div>
		</div>
	)
}

