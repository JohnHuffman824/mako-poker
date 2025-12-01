<!-- 7164a315-084d-4c4b-9ad0-9f0eef3ca6b8 7b80aa26-e8f4-415a-862f-1ec5ff298df6 -->
# GTO Poker Simulator - Architecture Design Document

## Executive Summary

**Project**: GTO Poker Simulator - A web application providing Game Theory Optimal advice for No-Limit Hold'em poker, with screen scraping capabilities and AI training modes.

**Key Technology Decisions**:

- **Backend**: Kotlin + Spring Boot (mirrors your Spider Impact experience)
- **Frontend**: React + TypeScript (keeps current foundation)
- **Database**: PostgreSQL
- **GTO Engine**: True CFR (Counterfactual Regret Minimization) algorithm built from scratch
- **Real-time**: WebSocket support via Spring WebSocket/STOMP
- **Deployment**: Cloud PaaS (AWS recommended)
- **User Model**: Multi-user SaaS-ready architecture

---

## Phase 1: Foundation (Weeks 1-8)

### 1.1 Project Restructure & Backend Setup

**Replace current Node.js/Express backend with Kotlin/Spring Boot:**

Create new project structure:

```
poker-gto/
├── backend/                    # Kotlin/Spring Boot
│   ├── src/main/kotlin/
│   │   └── com/pokergto/
│   │       ├── PokerGtoApplication.kt
│   │       ├── config/         # Spring configuration
│   │       ├── controller/     # REST controllers
│   │       ├── service/        # Business logic
│   │       ├── repository/     # Data access (Spring Data JPA)
│   │       ├── model/          # Domain entities
│   │       ├── dto/            # Data transfer objects
│   │       ├── solver/         # CFR solver engine
│   │       └── security/       # Auth configuration
│   ├── src/main/resources/
│   │   ├── application.yml
│   │   └── db/migration/       # Flyway migrations
│   └── build.gradle.kts
├── frontend/                   # React/TypeScript (migrate from client/)
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── lib/
│   │   ├── api/               # API client layer
│   │   └── types/
│   ├── package.json
│   └── vite.config.ts
├── shared/                     # Shared types (OpenAPI generated)
└── docker-compose.yml          # Local development
```

**Key Spring Boot dependencies** (build.gradle.kts):

```kotlin
dependencies {
    implementation("org.springframework.boot:spring-boot-starter-web")
    implementation("org.springframework.boot:spring-boot-starter-data-jpa")
    implementation("org.springframework.boot:spring-boot-starter-security")
    implementation("org.springframework.boot:spring-boot-starter-websocket")
    implementation("org.springframework.boot:spring-boot-starter-validation")
    implementation("org.postgresql:postgresql")
    implementation("org.flywaydb:flyway-core")
    implementation("com.fasterxml.jackson.module:jackson-module-kotlin")
    implementation("io.jsonwebtoken:jjwt-api:0.12.3")
}
```

### 1.2 Database Schema Design

**Core entities for PostgreSQL:**

```sql
-- Users & Authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP
);

-- Poker Sessions
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    hands_played INTEGER DEFAULT 0,
    session_pnl DECIMAL(12,2) DEFAULT 0,
    gto_adherence DECIMAL(5,2) DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP
);

-- Hand Scenarios (for analysis history)
CREATE TABLE scenarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id),
    hole_cards VARCHAR(10) NOT NULL,        -- e.g., "AsKh"
    community_cards VARCHAR(25),             -- e.g., "9h7s2dTcJd"
    position VARCHAR(10) NOT NULL,
    player_count INTEGER NOT NULL,
    player_stack DECIMAL(12,2) NOT NULL,
    pot_size DECIMAL(12,2) NOT NULL,
    blinds VARCHAR(20) NOT NULL,
    street VARCHAR(10) NOT NULL,            -- preflop, flop, turn, river
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- GTO Recommendations
CREATE TABLE recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scenario_id UUID REFERENCES scenarios(id),
    recommended_action VARCHAR(20) NOT NULL,
    action_confidence DECIMAL(5,2) NOT NULL,
    call_pct DECIMAL(5,2),
    raise_pct DECIMAL(5,2),
    fold_pct DECIMAL(5,2),
    recommended_bet_size DECIMAL(12,2),
    equity DECIMAL(5,4) NOT NULL,
    expected_value DECIMAL(12,4),
    calculation_time_ms INTEGER,
    solver_depth INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Pre-computed solver results cache
CREATE TABLE solver_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    situation_hash VARCHAR(64) UNIQUE NOT NULL,  -- Hash of game state
    strategy_data JSONB NOT NULL,                 -- CFR strategy output
    iterations INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 1.3 REST API Design

**Follow Spider Impact patterns - RESTful JSON APIs:**

```
Authentication:
POST   /api/auth/register        # User registration
POST   /api/auth/login           # Login (returns JWT)
POST   /api/auth/refresh         # Refresh token
POST   /api/auth/logout          # Logout

Sessions:
GET    /api/sessions             # List user's sessions
POST   /api/sessions             # Start new session
GET    /api/sessions/{id}        # Get session details
PATCH  /api/sessions/{id}        # Update session
DELETE /api/sessions/{id}        # End/delete session

GTO Analysis:
POST   /api/analyze              # Submit scenario for GTO analysis
GET    /api/analyze/{id}         # Get analysis result
POST   /api/analyze/quick        # Quick analysis (cached/heuristic)

Solver:
POST   /api/solver/solve         # Run full CFR solve (async)
GET    /api/solver/status/{id}   # Check solve progress
GET    /api/solver/result/{id}   # Get solve result

Game Simulation:
POST   /api/game/start           # Start AI game
POST   /api/game/{id}/action     # Player action
GET    /api/game/{id}/state      # Current game state
POST   /api/game/{id}/end        # End game

WebSocket:
/ws/game/{gameId}                # Real-time game updates
/ws/overlay                      # Screen scraping overlay updates
```

### 1.4 Authentication & Security

**Implement JWT-based auth (similar to Spider Impact's token auth):**

```kotlin
// SecurityConfig.kt
@Configuration
@EnableWebSecurity
class SecurityConfig {
    @Bean
    fun securityFilterChain(http: HttpSecurity): SecurityFilterChain {
        http
            .csrf { it.disable() }  // Disabled for API, use CORS
            .cors { it.configurationSource(corsConfigurationSource()) }
            .sessionManagement { 
                it.sessionCreationPolicy(SessionCreationPolicy.STATELESS) 
            }
            .authorizeHttpRequests {
                it.requestMatchers("/api/auth/**").permitAll()
                it.requestMatchers("/api/analyze/quick").permitAll()
                it.anyRequest().authenticated()
            }
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthFilter::class.java)
        return http.build()
    }
}
```

---

## Phase 2: CFR Solver Engine (Weeks 9-20)

### 2.1 CFR Algorithm Implementation

**CRITICAL: This is the most complex and time-intensive part.**

**Core CFR concepts to implement:**

```kotlin
// solver/GameState.kt
data class GameState(
    val holeCards: List<Card>,
    val communityCards: List<Card>,
    val potSize: Double,
    val playerStacks: List<Double>,
    val currentPlayer: Int,
    val street: Street,
    val actionHistory: List<Action>,
    val isTerminal: Boolean
)

// solver/InformationSet.kt
data class InformationSet(
    val cardAbstraction: String,    // Bucketed cards
    val actionSequence: String,      // Betting history
    val potFraction: Double          // SPR bucket
) {
    // CFR stores regrets and strategies per info set
    var cumulativeRegrets: DoubleArray = DoubleArray(NUM_ACTIONS)
    var cumulativeStrategy: DoubleArray = DoubleArray(NUM_ACTIONS)
    
    fun getStrategy(): DoubleArray {
        // Regret matching algorithm
        val strategy = DoubleArray(NUM_ACTIONS)
        var normalizingSum = 0.0
        
        for (a in 0 until NUM_ACTIONS) {
            strategy[a] = maxOf(cumulativeRegrets[a], 0.0)
            normalizingSum += strategy[a]
        }
        
        for (a in 0 until NUM_ACTIONS) {
            strategy[a] = if (normalizingSum > 0) {
                strategy[a] / normalizingSum
            } else {
                1.0 / NUM_ACTIONS
            }
        }
        return strategy
    }
}

// solver/CFRSolver.kt
class CFRSolver(
    private val gameTree: GameTree,
    private val cardAbstraction: CardAbstraction,
    private val betAbstraction: BetAbstraction
) {
    private val infoSets = ConcurrentHashMap<String, InformationSet>()
    
    fun solve(iterations: Int): SolverResult {
        repeat(iterations) { i ->
            val cards = dealRandomHands()
            cfr(gameTree.root, cards, 1.0, 1.0)
            
            if (i % 1000 == 0) {
                publishProgress(i, iterations)
            }
        }
        return buildResult()
    }
    
    private fun cfr(
        node: GameNode,
        cards: DealtCards,
        reachProb0: Double,
        reachProb1: Double
    ): Double {
        if (node.isTerminal) {
            return node.getUtility(cards)
        }
        
        val infoSet = getInfoSet(node, cards)
        val strategy = infoSet.getStrategy()
        val utilities = DoubleArray(NUM_ACTIONS)
        var nodeUtility = 0.0
        
        for (a in node.legalActions.indices) {
            val childNode = node.children[a]
            utilities[a] = if (node.currentPlayer == 0) {
                -cfr(childNode, cards, reachProb0 * strategy[a], reachProb1)
            } else {
                -cfr(childNode, cards, reachProb0, reachProb1 * strategy[a])
            }
            nodeUtility += strategy[a] * utilities[a]
        }
        
        // Update regrets
        val opponentReachProb = if (node.currentPlayer == 0) reachProb1 else reachProb0
        for (a in node.legalActions.indices) {
            val regret = utilities[a] - nodeUtility
            infoSet.cumulativeRegrets[a] += opponentReachProb * regret
        }
        
        // Update average strategy
        val playerReachProb = if (node.currentPlayer == 0) reachProb0 else reachProb1
        for (a in node.legalActions.indices) {
            infoSet.cumulativeStrategy[a] += playerReachProb * strategy[a]
        }
        
        return nodeUtility
    }
}
```

### 2.2 Abstractions (Essential for Tractability)

**Card Abstraction** - Group similar hands into "buckets":

```kotlin
// solver/abstraction/CardAbstraction.kt
class EMDCardAbstraction : CardAbstraction {
    // Earth Mover's Distance clustering
    // Groups hands by equity distribution similarity
    
    fun getAbstractedHand(holeCards: List<Card>, board: List<Card>): Int {
        val equityHistogram = calculateEquityHistogram(holeCards, board)
        return findNearestCluster(equityHistogram)
    }
}
```

**Bet Abstraction** - Limit possible bet sizes:

```kotlin
// solver/abstraction/BetAbstraction.kt
class FCPABetAbstraction : BetAbstraction {
    // Fold, Check, Pot-sized bet, All-in
    override fun getLegalBetSizes(potSize: Double, stack: Double): List<Double> {
        return listOf(
            0.0,           // Check/Fold
            potSize * 0.5, // Half pot
            potSize,       // Pot
            stack          // All-in
        ).filter { it <= stack }
    }
}
```

### 2.3 Performance Optimizations

```kotlin
// Use Kotlin coroutines for parallel CFR
class ParallelCFRSolver {
    suspend fun solve(iterations: Int) = coroutineScope {
        val chunks = iterations / Runtime.getRuntime().availableProcessors()
        
        (0 until availableProcessors()).map { 
            async(Dispatchers.Default) {
                solveChunk(chunks)
            }
        }.awaitAll()
        
        mergeResults()
    }
}

// Cache frequently accessed info sets in Redis
@Cacheable("infoSets")
fun getStrategy(infoSetKey: String): Strategy {
    // ...
}
```

---

## Phase 3: Frontend Modernization (Weeks 8-14, parallel with Phase 2)

### 3.1 Migrate to Production React Architecture

**Keep valuable existing components, modernize structure:**

```
frontend/src/
├── api/
│   ├── client.ts              # Axios/fetch wrapper with interceptors
│   ├── auth.ts                # Auth API calls
│   ├── solver.ts              # Solver API calls
│   └── game.ts                # Game API calls
├── components/
│   ├── poker/                 # Domain components (keep & enhance)
│   │   ├── ScenarioInput/
│   │   ├── GTORecommendation/
│   │   ├── HandStrength/
│   │   ├── OpponentRange/
│   │   ├── RangeGrid/
│   │   └── CardSelector/
│   └── ui/                    # shadcn/ui components (keep)
├── features/                  # Feature-based organization
│   ├── auth/
│   │   ├── LoginForm.tsx
│   │   ├── RegisterForm.tsx
│   │   └── useAuth.ts
│   ├── analyzer/
│   │   ├── AnalyzerPage.tsx
│   │   └── useAnalysis.ts
│   ├── game/
│   │   ├── GamePage.tsx
│   │   ├── AIOpponent.tsx
│   │   └── useGame.ts
│   └── solver/
│       ├── SolverPage.tsx
│       └── useSolver.ts
├── hooks/
│   ├── useWebSocket.ts        # NEW: WebSocket hook
│   └── usePoker.ts            # Poker-specific hooks
├── store/                     # Zustand for global state
│   ├── authStore.ts
│   └── gameStore.ts
├── lib/
│   ├── poker-logic.ts         # Keep existing logic
│   └── websocket.ts           # WebSocket client
└── types/
    └── generated/             # OpenAPI generated types
```

### 3.2 State Management with Zustand

**Simpler than Redux, good for this scale:**

```typescript
// store/gameStore.ts
import { create } from 'zustand'

interface GameState {
  currentGame: Game | null
  recommendation: GTORecommendation | null
  isCalculating: boolean
  
  // Actions
  setGame: (game: Game) => void
  setRecommendation: (rec: GTORecommendation) => void
  submitScenario: (scenario: Scenario) => Promise<void>
}

export const useGameStore = create<GameState>((set) => ({
  currentGame: null,
  recommendation: null,
  isCalculating: false,
  
  setGame: (game) => set({ currentGame: game }),
  setRecommendation: (rec) => set({ recommendation: rec }),
  
  submitScenario: async (scenario) => {
    set({ isCalculating: true })
    try {
      const result = await solverApi.analyze(scenario)
      set({ recommendation: result, isCalculating: false })
    } catch (error) {
      set({ isCalculating: false })
      throw error
    }
  }
}))
```

### 3.3 WebSocket Integration

```typescript
// lib/websocket.ts
import { Client } from '@stomp/stompjs'

class PokerWebSocket {
  private client: Client
  
  constructor() {
    this.client = new Client({
      brokerURL: 'ws://localhost:8080/ws',
      reconnectDelay: 5000
    })
  }
  
  subscribeToGame(gameId: string, callback: (msg: GameUpdate) => void) {
    this.client.subscribe(`/topic/game/${gameId}`, (message) => {
      callback(JSON.parse(message.body))
    })
  }
  
  subscribeToOverlay(callback: (msg: OverlayUpdate) => void) {
    this.client.subscribe('/user/queue/overlay', (message) => {
      callback(JSON.parse(message.body))
    })
  }
}
```

---

## Phase 4: AI Opponent & Game Simulation (Weeks 15-22)

### 4.1 Difficulty-based AI System

```kotlin
// service/ai/AIOpponent.kt
sealed class AIOpponent(val name: String) {
    abstract fun getAction(gameState: GameState): Action
}

class EasyBot : AIOpponent("Rookie Rick") {
    // Random with basic hand strength awareness
    override fun getAction(gameState: GameState): Action {
        val handStrength = evaluateHand(gameState)
        return when {
            handStrength > 0.8 -> Action.Raise(gameState.potSize)
            handStrength > 0.5 -> Action.Call
            random() < 0.3 -> Action.Call  // Loose calls
            else -> Action.Fold
        }
    }
}

class MediumBot : AIOpponent("Calculated Carl") {
    // Uses simplified GTO with exploitative adjustments
    override fun getAction(gameState: GameState): Action {
        val strategy = getSimplifiedStrategy(gameState)
        return sampleAction(strategy)
    }
}

class HardBot : AIOpponent("GTO Gary") {
    // Uses full CFR-derived strategy
    @Autowired
    private lateinit var solverService: SolverService
    
    override fun getAction(gameState: GameState): Action {
        val strategy = solverService.getStrategy(gameState)
        return sampleFromStrategy(strategy)
    }
}
```

### 4.2 Game Flow Service

```kotlin
// service/GameService.kt
@Service
class GameService(
    private val gameRepository: GameRepository,
    private val aiFactory: AIOpponentFactory,
    private val messagingTemplate: SimpMessagingTemplate
) {
    fun startGame(userId: UUID, difficulty: Difficulty): Game {
        val game = Game(
            userId = userId,
            opponent = aiFactory.create(difficulty),
            playerStack = 100.0,  // Big blinds
            opponentStack = 100.0
        )
        return gameRepository.save(game)
    }
    
    fun processAction(gameId: UUID, action: Action): GameState {
        val game = gameRepository.findById(gameId)
        game.applyAction(action)
        
        if (game.isOpponentTurn()) {
            val aiAction = game.opponent.getAction(game.state)
            game.applyAction(aiAction)
            
            // Real-time update via WebSocket
            messagingTemplate.convertAndSend(
                "/topic/game/${gameId}",
                GameUpdate(game.state, aiAction)
            )
        }
        
        return gameRepository.save(game).state
    }
}
```

---

## Phase 5: Screen Scraping (Weeks 20-28)

### 5.1 Desktop Application (Electron)

**Separate Electron app that communicates with main backend:**

```
poker-overlay/
├── electron/
│   ├── main.ts              # Electron main process
│   ├── preload.ts           # Bridge to renderer
│   └── capture/
│       ├── ScreenCapture.ts # Native screen capture
│       └── WindowFinder.ts  # Find poker windows
├── src/
│   ├── App.tsx              # Overlay UI
│   ├── recognition/
│   │   ├── CardRecognition.ts   # ML card detection
│   │   ├── TableRecognition.ts  # Table state parsing
│   │   └── models/              # TensorFlow.js models
│   └── overlay/
│       ├── OverlayWindow.tsx    # Transparent overlay
│       └── GTODisplay.tsx       # GTO advice display
└── package.json
```

### 5.2 Image Recognition Pipeline

```typescript
// recognition/CardRecognition.ts
import * as tf from '@tensorflow/tfjs-node'

class CardRecognizer {
  private model: tf.LayersModel
  
  async loadModel() {
    this.model = await tf.loadLayersModel('file://./models/card-recognition/model.json')
  }
  
  async recognizeCards(screenshot: Buffer, regions: CardRegion[]): Promise<Card[]> {
    const cards: Card[] = []
    
    for (const region of regions) {
      const cardImage = this.extractRegion(screenshot, region)
      const tensor = this.preprocessImage(cardImage)
      const prediction = this.model.predict(tensor)
      cards.push(this.decodeCard(prediction))
    }
    
    return cards
  }
}
```

### 5.3 Browser Extension

**For browser-based poker sites:**

```
poker-extension/
├── manifest.json
├── content/
│   ├── content.ts           # Injected into poker page
│   └── DOMScanner.ts        # Parse poker table DOM
├── background/
│   └── background.ts        # Service worker
├── popup/
│   └── Popup.tsx            # Extension popup UI
└── overlay/
    └── OverlayInjector.ts   # Inject GTO overlay
```

---

## Phase 6: Production Deployment (Weeks 24-30)

### 6.1 AWS Infrastructure

```yaml
# infrastructure/docker-compose.yml (local dev)
services:
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=dev
      - DATABASE_URL=postgresql://postgres:5432/pokergto
    depends_on:
      - postgres
      - redis
      
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
      
  postgres:
    image: postgres:16
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=pokergto
      
  redis:
    image: redis:7
    volumes:
      - redis_data:/data
```

**AWS Architecture:**

- **ECS Fargate**: Run backend containers
- **RDS PostgreSQL**: Managed database
- **ElastiCache Redis**: Solver result caching
- **CloudFront + S3**: Frontend static hosting
- **Route53**: DNS management
- **ALB**: Load balancing with WebSocket support

### 6.2 CI/CD Pipeline

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
    
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run backend tests
        run: cd backend && ./gradlew test
      - name: Run frontend tests
        run: cd frontend && npm test
        
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS
        run: |
          aws ecs update-service --cluster pokergto --service backend
```

---

## Implementation Priority & Timeline

Given 10-20 hours/week:

| Phase | Duration | Deliverable |

|-------|----------|-------------|

| **Phase 1** | Weeks 1-8 | Kotlin backend with auth, PostgreSQL schema, REST API |

| **Phase 2** | Weeks 9-20 | Basic CFR solver (simplified game tree first) |

| **Phase 3** | Weeks 8-14 | Modernized React frontend with WebSocket |

| **Phase 4** | Weeks 15-22 | AI opponents and game simulation |

| **Phase 5** | Weeks 20-28 | Screen scraping (desktop app first) |

| **Phase 6** | Weeks 24-30 | Production deployment on AWS |

**Total estimated timeline: 7-8 months to MVP**

---

## Key Architectural Decisions (ADRs)

### ADR-001: Kotlin + Spring Boot for Backend

**Context**: Need performant backend for CFR calculations

**Decision**: Use Kotlin with Spring Boot

**Rationale**: Your professional expertise, excellent for computation-heavy workloads, mature ecosystem

### ADR-002: Build CFR from Scratch

**Context**: Need true GTO solving capability

**Decision**: Implement CFR algorithm from scratch with abstractions

**Rationale**: Full control, deep understanding, no licensing dependencies

**Risk**: High complexity, requires significant algorithm expertise

### ADR-003: PostgreSQL with Redis Caching

**Context**: Need persistent storage + fast solver result access

**Decision**: PostgreSQL for primary data, Redis for solver cache

**Rationale**: JSONB for strategy storage, Redis for sub-millisecond cache hits

### ADR-004: JWT + Refresh Token Authentication

**Context**: Multi-user SaaS with API access

**Decision**: Stateless JWT authentication with refresh tokens

**Rationale**: Scalable, works well with WebSockets, industry standard

---

## Risks & Mitigations

| Risk | Impact | Mitigation |

|------|--------|------------|

| CFR implementation complexity | High | Start with toy games (Kuhn Poker), iterate to NLHE |

| Screen scraping breaks with poker site updates | Medium | Modular recognition pipeline, quick update capability |

| WebSocket scaling | Medium | Use Redis pub/sub for horizontal scaling |

| Legal concerns (scraping) | Low | User confirmed legality, document ToS compliance |

---

## Next Steps

1. **Immediate**: Set up new project structure with Kotlin/Spring Boot skeleton
2. **Week 1-2**: Implement PostgreSQL schema and basic REST endpoints
3. **Week 3-4**: Port existing poker logic to Kotlin, implement auth
4. **Week 5+**: Begin CFR research and implementation

Would you like me to begin with Phase 1 implementation?