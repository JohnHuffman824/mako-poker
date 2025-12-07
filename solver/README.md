solver/
├── requirements.txt                    # Python dependencies (PyTorch, ONNX, numpy)
├── src/
│   ├── __init__.py                    # Package root with version and docstring
│   ├── cli.py                         # Command-line interface for training/export
│   │
│   ├── enums/                         # ═══ ENUM DEFINITIONS ═══
│   │   ├── __init__.py                # Exports Rank, Suit
│   │   └── card_enums.py              # Rank (2-A) and Suit (♠♥♦♣) enums
│   │
│   ├── game/                          # ═══ POKER PRIMITIVES ═══
│   │   ├── __init__.py                # Module exports
│   │   ├── card.py                    # Card class with rank/suit
│   │   ├── deck.py                    # Deck with shuffle/deal operations
│   │   ├── action.py                  # ActionType enum and Action dataclass
│   │   ├── game_state.py              # Immutable game state for CFR traversal
│   │   ├── hand_evaluator.py          # 5-7 card hand evaluation
│   │   └── hand_rankings.py           # HandType enum and ranking constants
│   │
│   ├── abstraction/                   # ═══ GAME TREE COMPRESSION ═══
│   │   ├── __init__.py                # Exports HandBucketing, ActionAbstraction
│   │   ├── hand_bucketing.py          # Groups 1326 hands into ~200 buckets
│   │   └── action_abstraction.py      # Limits bet sizes to discrete set
│   │
│   ├── cfr/                           # ═══ CFR ALGORITHMS ═══
│   │   ├── __init__.py                # Exports solvers
│   │   ├── information_set.py         # Stores regrets, computes strategies
│   │   ├── cfr_plus.py                # CFR+ solver (tabular) + Kuhn solver
│   │   └── deep_cfr.py                # Deep CFR with neural networks
│   │
│   └── training/                      # ═══ TRAINING & EXPORT ═══
│       ├── __init__.py                # Exports training utilities
│       ├── trainer.py                 # High-level training orchestration
│       ├── value_network.py           # PyTorch neural network
│       └── onnx_export.py             # ONNX export for TypeScript inference
│
└── tests/                             # ═══ UNIT TESTS ═══
    ├── __init__.py
    ├── test_card.py                   # Card/Rank/Suit tests
    ├── test_deck.py                   # Deck operations tests
    ├── test_action.py                 # Action creation tests
    ├── test_game_state.py             # Game state transitions
    ├── test_hand_evaluator.py         # Hand evaluation correctness
    ├── test_hand_rankings.py          # Hand type ranges
    ├── test_hand_bucketing.py         # Hand grouping tests
    ├── test_action_abstraction.py     # Bet size abstraction tests
    ├── test_information_set.py        # Regret matching tests
    ├── test_cfr_plus.py               # CFR+ algorithm tests
    ├── test_kuhn_validation.py        # Nash equilibrium validation
    └── test_onnx_export.py            # ONNX export tests

-------------------------------------------------------------------------------------

	                	 ┌─────────────────────────────────────┐
                         │              cli.py                 │
                         │   Entry point for all operations    │
                         └───────────────┬─────────────────────┘
                                         │
              ┌──────────────────────────┼──────────────────────────┐
              ▼                          ▼                          ▼
   ┌───────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
   │      trainer.py       │    │    cfr_plus.py      │    │    deep_cfr.py      │
   │ Training orchestration│    │  Tabular CFR+       │    │  Neural network CFR │
   └──────────┬────────────┘    └──────────┬──────────┘    └──────────┬──────────┘
              │                            │                          │
              │                            ▼                          │
              │               ┌─────────────────────────┐             │
              │               │  information_set.py     │             │
              │               │  Regret/strategy storage│             │
              │               └────────────┬────────────┘             │
              │                            │                          │
              └─────────────────┬──────────┴──────────────────────────┘
                                ▼
              ┌────────────────────────────────────────────┐
              │             ABSTRACTION LAYER              │
              │  ┌───────────────┐  ┌──────────────────┐   │
              │  │hand_bucketing │  │action_abstraction│   │
              │  │ 1326→200 hands│  │ continuous→7 bets│   │
              │  └───────────────┘  └──────────────────┘   │
              └────────────────────────┬───────────────────┘
                                       ▼
              ┌────────────────────────────────────────────┐
              │               GAME STATE LAYER             │
              │                game_state.py               │
              │  Tracks: hole cards, board, pot, stacks    │
              │  Methods: apply_action(), get_legal_actions│
              └────────────────────────┬───────────────────┘
                                       ▼
              ┌────────────────────────────────────────────┐
              │              PRIMITIVES LAYER              │
              │  ┌────────┐  ┌──────┐  ┌────────────────┐  │
              │  │card.py │  │deck.py│  │hand_evaluator │  │
              │  │action.py│  │      │  │hand_rankings  │  │
              │  └────────┘  └──────┘  └────────────────┘  │
              └────────────────────────┬───────────────────┘
                                       ▼
              ┌────────────────────────────────────────────┐
              │                 ENUMS LAYER                │
              │            card_enums.py                   │
              │         Rank (2-14), Suit (0-3)            │
              └────────────────────────────────────────────┘