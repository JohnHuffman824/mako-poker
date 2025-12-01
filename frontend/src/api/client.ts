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
    displayName: string
  }) {
    return this.request<{
      accessToken: string
      refreshToken: string
      user: { id: string; email: string; displayName: string }
    }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async login(data: { email: string; password: string }) {
    return this.request<{
      accessToken: string
      refreshToken: string
      user: { id: string; email: string; displayName: string }
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    })
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
  async startGame(data: {
    playerCount: number
    startingStack?: number
    smallBlind?: number
    bigBlind?: number
  }) {
    return this.request<GameStateResponse>('/game/start', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async getGame(gameId: string) {
    return this.request<GameStateResponse>(`/game/${gameId}`)
  }

  async getCurrentGame() {
    return this.request<GameStateResponse | null>('/game/current')
  }

  async dealHand(gameId: string) {
    return this.request<GameStateResponse>(`/game/${gameId}/deal`, {
      method: 'POST',
    })
  }

  async submitAction(gameId: string, data: { action: string; amount?: number }) {
    return this.request<GameStateResponse>(`/game/${gameId}/action`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async processAiAction(gameId: string) {
    return this.request<GameStateResponse>(`/game/${gameId}/ai-action`, {
      method: 'POST',
    })
  }

  async updatePlayerCount(gameId: string, count: number) {
    return this.request<GameStateResponse>(
      `/game/${gameId}/players?count=${count}`,
      { method: 'PATCH' }
    )
  }

  async addPlayerAtSeat(gameId: string, seatIndex: number) {
    return this.request<GameStateResponse>(
      `/game/${gameId}/seat/${seatIndex}`,
      { method: 'POST' }
    )
  }

  async removePlayerAtSeat(gameId: string, seatIndex: number) {
    return this.request<GameStateResponse>(
      `/game/${gameId}/seat/${seatIndex}`,
      { method: 'DELETE' }
    )
  }

  async updateBlinds(gameId: string, bigBlind: number) {
    return this.request<GameStateResponse>(
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

/**
 * Card ranks (A, 2-9, T, J, Q, K).
 */
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' |
  'T' | 'J' | 'Q' | 'K'

/**
 * Card suits (matching backend displayName format).
 */
export type Suit = 'spades' | 'hearts' | 'diamonds' | 'clubs'

/**
 * Card data from API.
 * rank: Symbol (A, 2-9, T, J, Q, K)
 * suit: Full name (spades, hearts, diamonds, clubs)
 * display: Short notation (e.g., "As" for Ace of Spades)
 */
export interface CardDto {
  rank: Rank
  suit: Suit
  display: string
}

/**
 * Player data from API.
 */
export interface PlayerDto {
  seatIndex: number
  position: string
  stack: number
  holeCards: CardDto[] | null
  lastAction: string | null
  isFolded: boolean
  isAllIn: boolean
  currentBet: number
  isHero: boolean
}

/**
 * Side pot data from API.
 * Created when players go all-in for different amounts.
 */
export interface SidePotDto {
  id: number
  amount: number
  eligiblePlayerSeats: number[]
  capPerPlayer: number
  isMainPot: boolean
  displayName: string
}

/**
 * Game state response from API.
 * dealerSeatIndex: Physical seat (0-9) where button is located.
 * currentPlayerIndex: Index into players array for current turn.
 */
interface GameStateResponse {
  id: string
  playerCount: number
  players: PlayerDto[]
  heroSeatIndex: number
  dealerSeatIndex: number
  currentPlayerIndex: number
  pot: number
  street: string
  communityCards: CardDto[]
  isHandInProgress: boolean
  blinds: { small: number; big: number }
  minRaise: number
  maxRaise: number
  toCall: number
  winner: PlayerDto | null
  winningHand: string | null
  /** Available actions for current player */
  availableActions: string | null
  /** Player seat indices in action order (SB first, BTN last) */
  actionOrderSeats: number[] | null
  /** Whether hand has reached showdown (AI cards revealed) */
  isShowdown: boolean
  /** Side pots (when players are all-in for different amounts) */
  sidePots?: SidePotDto[]
  /** Player contributions this hand (seat index -> amount) */
  playerContributions?: Record<number, number>
}

export type { GameStateResponse }
export const api = new ApiClient()

