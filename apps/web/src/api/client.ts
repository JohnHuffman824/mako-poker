import type {
  GameState,
  StartGameRequest,
  PlayerActionRequest,
  User,
  AuthResponse
} from '@mako/shared'

const API_BASE = '/api'

interface ApiError {
  status: number
  error: string
  message: string
}

class ApiClient {
  private accessToken: string | null = null

  setToken(token: string | null) {
    this.accessToken = token
    if (token) {
      localStorage.setItem('accessToken', token)
    } else {
      localStorage.removeItem('accessToken')
    }
  }

  getToken(): string | null {
    if (!this.accessToken) {
      this.accessToken = localStorage.getItem('accessToken')
    }
    return this.accessToken
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> ?? {}),
    }

    const token = this.getToken()
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    })

    if (!response.ok) {
      const error: ApiError = await response.json().catch(() => ({
        status: response.status,
        error: response.statusText,
        message: 'An error occurred',
      }))
      throw error
    }

    // Handle empty responses
    const text = await response.text()
    return text ? JSON.parse(text) : (null as unknown as T)
  }

  // Health check
  async health() {
    return this.request<{ status: string; timestamp: string }>('/health')
  }

  // Auth endpoints
  async register(data: {
    email: string
    password: string
    displayName?: string
  }) {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(data: { email: string; password: string }) {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCurrentUser() {
    return this.request<{ user: User }>('/auth/me')
  }

  // Session endpoints
  async createSession(data: { gameType: string; blinds: string }) {
    return this.request<{
      id: string
      handsPlayed: number
      sessionPnl: number
      gtoAdherence: number
    }>('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getCurrentSession() {
    return this.request<{
      id: string
      handsPlayed: number
      sessionPnl: number
      gtoAdherence: number
    }>('/sessions/current')
  }

  // Analysis endpoints
  async analyzeQuick(data: {
    holeCards: string[]
    communityCards: string[]
    position: string
    playerCount: number
    potSize: number
    playerStack: number
    blinds: string
  }) {
    return this.request<{
      recommendedAction: string
      confidence: number
      callPercentage: number
      raisePercentage: number
      foldPercentage: number
      equity: number
      potOdds: string
    }>('/analyze/quick', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  // Game endpoints
  async startGame(data: StartGameRequest) {
    return this.request<GameState>('/game/start', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getGame(gameId: string) {
    return this.request<GameState>(`/game/${gameId}`)
  }

  async getCurrentGame() {
    return this.request<GameState | null>('/game/current')
  }

  async dealHand(gameId: string) {
    return this.request<GameState>(`/game/${gameId}/deal`, {
      method: 'POST',
    })
  }

  async submitAction(gameId: string, data: PlayerActionRequest) {
    return this.request<GameState>(`/game/${gameId}/action`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async processAiAction(gameId: string) {
    return this.request<GameState>(`/game/${gameId}/ai-action`, {
      method: 'POST',
    })
  }

  async updatePlayerCount(gameId: string, count: number) {
    return this.request<GameState>(
      `/game/${gameId}/players?count=${count}`,
      { method: 'PATCH' }
    )
  }

  async addPlayerAtSeat(gameId: string, seatIndex: number) {
    return this.request<GameState>(
      `/game/${gameId}/seat/${seatIndex}`,
      { method: 'POST' }
    )
  }

  async removePlayerAtSeat(gameId: string, seatIndex: number) {
    return this.request<GameState>(
      `/game/${gameId}/seat/${seatIndex}`,
      { method: 'DELETE' }
    )
  }

  async updateBlinds(gameId: string, bigBlind: number) {
    return this.request<GameState>(
      `/game/${gameId}/blinds`,
      {
        method: 'PATCH',
        body: JSON.stringify({ bigBlind, smallBlind: bigBlind / 2 }),
      }
    )
  }

  async endGame(gameId: string) {
    return this.request<void>(`/game/${gameId}`, {
      method: 'DELETE',
    })
  }
}

// Re-export types from shared package for backwards compatibility
export type {
  GameState as GameStateResponse,
  Card as CardDto,
  Player as PlayerDto,
  SidePot as SidePotDto,
  Rank,
  Suit
} from '@mako/shared'

export const api = new ApiClient()
