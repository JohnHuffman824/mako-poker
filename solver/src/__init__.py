"""
Mako Poker CFR Solver

A GTO (Game Theory Optimal) poker solver using Counterfactual Regret Minimization.

Main components:
- game: Core poker primitives (Card, Deck, Action, GameState, HandEvaluator)
- enums: Centralized enum definitions (Rank, Suit, Position, Street, ActionType)
- cfr: CFR algorithm implementations (CFRPlusSolver, DeepCFR, KuhnCFRSolver)
- abstraction: Game tree compression (HandBucketing, ActionAbstraction)
- training: Training utilities (Trainer, ValueNetwork)
- api: FastAPI microservice for serving strategies

Usage:
		# Train Kuhn Poker (validates CFR implementation)
		python -m src.cli train --solver kuhn --iterations 100000

		# Train tabular CFR+ for Heads-Up NLHE
		python -m src.cli train --solver tabular --iterations 10000

		# Start API server
		uvicorn src.api.server:app --host 0.0.0.0 --port 8081
"""

__version__ = '0.1.0'
