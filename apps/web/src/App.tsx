import { Route, Switch, Redirect } from 'wouter'
import { LoginPage } from '@/pages/login'
import { GamePage } from '@/features/game'
import { api } from '@/api/client'

/**
 * Protected route wrapper that redirects to login if not authenticated.
 */
function ProtectedRoute({ children }: { children: React.ReactNode }) {
	const token = api.getToken()
	
	if (!token) {
		return <Redirect to="/login" />
	}
	
	return <>{children}</>
}

/**
 * Main application with routing.
 */
function App() {
	return (
		<Switch>
			<Route path="/login">
				<LoginPage />
			</Route>
			
			<Route path="/game">
				<ProtectedRoute>
					<GamePage />
				</ProtectedRoute>
			</Route>
			
			{/* Default redirect to game (will redirect to login if not authed) */}
			<Route>
				<Redirect to="/game" />
			</Route>
		</Switch>
	)
}

export default App
