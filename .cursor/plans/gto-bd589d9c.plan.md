<!-- bd589d9c-0570-4a82-93ae-da3a3f83113f e2834af4-61a3-49d9-ab2a-e192966b35f2 -->
# GTO Poker Solver Implementation Plan - Comprehensive Edition

## What is CFR and Why Do We Need It?

**The Core Problem**: In poker, you don't know your opponent's cards. This makes it an "imperfect information game" - fundamentally different from chess where both players see everything. You can't just calculate the "best move" because the best move depends on what cards your opponent might have and how they might play them.

**Nash Equilibrium**: A strategy where neither player can improve by changing their approach. If you play a Nash equilibrium strategy in heads-up poker, you're guaranteed to not lose money in the long run against ANY opponent - even one who knows your strategy perfectly.

**Counterfactual Regret Minimization (CFR)**: An algorithm that finds Nash equilibrium by playing against itself millions of times, tracking "regret" (how much better you could have done with different actions), and gradually improving until neither "player" can do better.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        OFFLINE (Windows PC)                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  CFR+ Solver │───▶│  Deep CFR    │───▶│  Solution Exporter   │  │
│  │  (Baseline)  │    │  (PyTorch +  │    │  (.gto binary files) │  │
│  │              │    │   ROCm/CPU)  │    │                      │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                │
                      (File Transfer / Shared Storage)
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        ONLINE (Mac / Server)                        │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  Strategy    │◀──▶│  GTO Query   │◀──▶│  Kotlin GameService  │  │
│  │  Loader      │    │  Service     │    │  (AI Opponent)       │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
│         │                   │                      │               │
│         ▼                   ▼                      ▼               │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────────────┐  │
│  │  File-based  │    │    Redis     │    │     PostgreSQL       │  │
│  │  Solutions   │    │   (Cache)    │    │  (Sessions/History)  │  │
│  └──────────────┘    └──────────────┘    └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Phase 1: Python CFR Foundation (Windows PC)

### 1.1 Project Structure

Create a new `solver/` directory at project root:

```
solver/
├── pyproject.toml              # Poetry/pip dependencies
├── requirements.txt
├── src/
│   ├── __init__.py
│   ├── game/
│   │   ├── __init__.py
│   │   ├── card.py             # Card/Deck representation
│   │   ├── hand_evaluator.py   # Hand ranking (port from Kotlin)
│   │   ├── game_state.py       # Poker game state
│   │   └── action.py           # Bet/Call/Fold/Raise
│   ├── abstraction/
│   │   ├── __init__.py
│   │   ├── hand_bucketing.py   # Equity-based clustering
│   │   └── action_abstraction.py
│   ├── cfr/
│   │   ├── __init__.py
│   │   ├── information_set.py  # Infoset representation
│   │   ├── vanilla_cfr.py      # CFR+ baseline
│   │   ├── mccfr.py            # Monte Carlo CFR
│   │   └── deep_cfr.py         # Neural network CFR
│   ├── training/
│   │   ├── __init__.py
│   │   ├── trainer.py          # Training loop
│   │   └── value_network.py    # PyTorch neural net
│   ├── export/
│   │   ├── __init__.py
│   │   └── strategy_exporter.py
│   └── cli.py                  # Command-line interface
├── tests/
│   ├── test_kuhn_poker.py      # Validate against known solution
│   ├── test_hand_evaluator.py
│   └── test_cfr.py
└── scripts/
    ├── train_preflop.py
    ├── train_postflop.py
    └── export_solutions.py
```

### 1.2 Core Dependencies

```toml
# pyproject.toml
[tool.poetry.dependencies]
python = "^3.10"
numpy = "^1.24"
torch = "^2.0"  # With ROCm support
numba = "^0.57"  # JIT compilation for hot paths
h5py = "^3.8"    # Efficient strategy storage
tqdm = "^4.65"   # Progress bars
```

### 1.3 Key Implementation Files

**Game State** ([solver/src/game/game_state.py](solver/src/game/game_state.py)):

- Heads-up NLHE game tree representation
- History tracking (action sequence)
- Terminal node detection and payoff calculation

**Information Set** ([solver/src/cfr/information_set.py](solver/src/cfr/information_set.py)):

- Regret accumulation
- Strategy averaging
- Regret matching implementation

**CFR+ Solver** ([solver/src/cfr/vanilla_cfr.py](solver/src/cfr/vanilla_cfr.py)):

- Based on your existing `KuhnPoker.py` pattern
- Extended for NLHE with abstractions
- Parallel iteration support (multiprocessing)

---

## Phase 2: Abstraction Layer

### 2.1 Hand Bucketing (Equity Clustering)

For Heads-Up preflop, group 169 starting hands into ~10-20 buckets based on:

- Hand equity vs random opponent range
- Hand playability characteristics
```python
# abstraction/hand_bucketing.py
class HandBucketing:
    def __init__(self, num_buckets: int = 20):
        self.buckets = self._compute_preflop_buckets(num_buckets)
    
    def get_bucket(self, hole_cards: tuple, board: list) -> int:
        """Returns bucket ID (0 to num_buckets-1)"""
        if not board:  # Preflop
            return self._preflop_bucket(hole_cards)
        else:  # Postflop
            equity = self._calculate_equity(hole_cards, board)
            return self._equity_to_bucket(equity)
```


### 2.2 Action Abstraction

Limit bet sizes to manageable set:

```python
# abstraction/action_abstraction.py
PREFLOP_ACTIONS = ['fold', 'call', 'raise_2.5x', 'raise_3x', 'all_in']
POSTFLOP_ACTIONS = ['fold', 'check', 'call', 'bet_33', 'bet_67', 'bet_100', 'all_in']

class ActionAbstraction:
    def get_legal_actions(self, game_state) -> list:
        """Returns abstracted action set based on street and pot"""
```

---

## Phase 3: Deep CFR with ROCm

### 3.1 ROCm Setup (Windows with AMD GPU)

```bash
# Install PyTorch with ROCm support
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/rocm5.4.2
```

### 3.2 Value Network Architecture

```python
# training/value_network.py
class PokerValueNetwork(nn.Module):
    """
    Approximates counterfactual values for game states.
    Input: [hand_bucket, board_texture, pot_size, action_history]
    Output: EV for each possible action
    """
    def __init__(self, input_dim: int, hidden_dim: int = 256):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU(),
            nn.Linear(hidden_dim, len(ACTIONS))
        )
```

### 3.3 Deep CFR Training Loop

```python
# training/trainer.py
class DeepCFRTrainer:
    """
    Trains value network via self-play CFR iterations.
    Stores advantage samples in reservoir, trains periodically.
    """
    def train(self, iterations: int, checkpoint_every: int = 10000):
        for i in range(iterations):
            # Sample game and traverse
            cards = self.deal_random_hands()
            self.cfr_traverse(cards, history='', reach_probs=[1.0, 1.0])
            
            if i % checkpoint_every == 0:
                self.train_value_network()
                self.save_checkpoint(f'checkpoint_{i}.pt')
```

---

## Phase 4: Solution Export Format

### 4.1 Binary Strategy File Format

```
.gto file structure:
├── Header (version, game_type, abstraction_params)
├── Preflop Strategies
│   └── [infoset_key] -> [action_probabilities]
├── Flop Strategies (indexed by board texture)
│   └── [board_bucket][infoset_key] -> [action_probabilities]
├── Turn Strategies
└── River Strategies
```

### 4.2 Export Script

```python
# export/strategy_exporter.py
class StrategyExporter:
    def export(self, trainer: DeepCFRTrainer, output_path: str):
        """Export trained strategies to .gto binary format"""
        with h5py.File(output_path, 'w') as f:
            f.attrs['version'] = '1.0'
            f.attrs['game_type'] = 'HUNL'
            
            # Export preflop
            preflop_grp = f.create_group('preflop')
            for infoset, strategy in trainer.get_preflop_strategies():
                preflop_grp.create_dataset(infoset, data=strategy)
```

---

## Phase 5: Kotlin Backend Integration

### 5.1 Solution Loader Service

**File:** [backend/src/main/kotlin/com/mako/service/GtoSolutionLoader.kt](backend/src/main/kotlin/com/mako/service/GtoSolutionLoader.kt)

```kotlin
@Service
class GtoSolutionLoader(
    @Value("\${gto.solutions.path}") private val solutionsPath: String
) {
    private val preflopStrategies = ConcurrentHashMap<String, FloatArray>()
    
    @PostConstruct
    fun loadSolutions() {
        // Load preflop strategies into memory (small enough)
        // Index postflop strategies for lazy loading
    }
    
    fun getStrategy(infosetKey: String): FloatArray? {
        return preflopStrategies[infosetKey] 
            ?: loadFromDisk(infosetKey)
    }
}
```

### 5.2 GTO Query Service

**File:** [backend/src/main/kotlin/com/mako/service/GtoQueryService.kt](backend/src/main/kotlin/com/mako/service/GtoQueryService.kt)

```kotlin
@Service
class GtoQueryService(
    private val solutionLoader: GtoSolutionLoader,
    private val handBucketing: HandBucketing,
    private val redisTemplate: RedisTemplate<String, String>
) {
    /**
     * Returns GTO strategy for current game state.
     * Checks cache first, then loads from solution files.
     */
    fun getGtoStrategy(gameState: GameState): GtoStrategyResponse {
        val infosetKey = buildInfosetKey(gameState)
        
        // Check Redis cache
        val cached = redisTemplate.opsForValue().get(infosetKey)
        if (cached != null) return deserialize(cached)
        
        // Load from solutions
        val strategy = solutionLoader.getStrategy(infosetKey)
        
        // Cache and return
        redisTemplate.opsForValue().set(infosetKey, serialize(strategy))
        return GtoStrategyResponse(strategy)
    }
}
```

### 5.3 AI Opponent Integration

Modify existing [backend/src/main/kotlin/com/mako/service/AiPlayerService.kt](backend/src/main/kotlin/com/mako/service/AiPlayerService.kt):

```kotlin
@Service
class AiPlayerService(
    private val gtoQueryService: GtoQueryService
) {
    enum class AiDifficulty { EASY, MEDIUM, HARD, GTO }
    
    fun getAction(gameState: GameState, difficulty: AiDifficulty): PlayerAction {
        return when (difficulty) {
            AiDifficulty.GTO -> getGtoAction(gameState)
            AiDifficulty.HARD -> getExploitativeAction(gameState)
            else -> getSimpleAction(gameState)
        }
    }
    
    private fun getGtoAction(gameState: GameState): PlayerAction {
        val strategy = gtoQueryService.getGtoStrategy(gameState)
        return sampleFromStrategy(strategy)
    }
}
```

---

## Phase 6: API Endpoints

### 6.1 GTO Analysis Endpoint

**File:** [backend/src/main/kotlin/com/mako/controller/GtoController.kt](backend/src/main/kotlin/com/mako/controller/GtoController.kt)

```kotlin
@RestController
@RequestMapping("/api/gto")
class GtoController(
    private val gtoQueryService: GtoQueryService
) {
    @PostMapping("/analyze")
    fun analyzePosition(@RequestBody request: GtoAnalysisRequest): GtoAnalysisResponse {
        return gtoQueryService.analyzePosition(request)
    }
    
    @GetMapping("/strategy")
    fun getStrategy(
        @RequestParam holeCards: String,
        @RequestParam position: String,
        @RequestParam board: String?,
        @RequestParam potSize: Double,
        @RequestParam actionHistory: String
    ): GtoStrategyResponse {
        return gtoQueryService.getStrategy(...)
    }
}
```

---

## Implementation Order

| Phase | Duration | Deliverable |

|-------|----------|-------------|

| 1.1-1.3 | Week 1-2 | Python project structure, game state, hand evaluator |

| 2.1-2.2 | Week 3 | Abstraction layer (hand bucketing, action abstraction) |

| 1.3 + Test | Week 4-5 | CFR+ solver with Kuhn Poker validation |

| 3.1-3.3 | Week 6-8 | Deep CFR implementation with ROCm |

| 4.1-4.2 | Week 9 | Solution export format and scripts |

| 5.1-5.3 | Week 10-11 | Kotlin integration (loader, query service, AI) |

| 6.1 | Week 12 | API endpoints and testing |

---

## File Transfer Strategy (Windows to Mac)

Options for syncing solutions between machines:

1. **Shared network drive** - Simple, works for local development
2. **Git LFS** - Version control for large binary files
3. **rsync over SSH** - Efficient incremental sync
4. **Cloud storage (S3/GCS)** - Best for production/multi-machine

---

## Testing Strategy

1. **Kuhn Poker Validation**: CFR output should match known Nash equilibrium
2. **Heads-Up Preflop**: Compare with published GTO preflop charts
3. **Integration Tests**: End-to-end query from Kotlin to solution files
4. **Performance Benchmarks**: Measure query latency (<100ms target for cached)

---

## Risks and Mitigations

| Risk | Mitigation |

|------|------------|

| ROCm compatibility issues | Fallback to CPU training, design for cloud GPU migration |

| Solution files too large | Aggressive abstraction, lazy loading, compression |

| CFR convergence too slow | Start with smaller games, use MCCFR sampling |

| Abstraction error too high | Tune bucket counts, validate against known solutions |