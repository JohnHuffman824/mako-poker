"""
Mako Poker CFR Solver (Training Only)

A GTO (Game Theory Optimal) poker solver using Counterfactual Regret Minimization.
Trained models are exported to ONNX format for TypeScript inference in production.

Main components:
- game: Core poker primitives (Card, Deck, Action, GameState, HandEvaluator)
- enums: Card enums (Rank, Suit)
- cfr: CFR algorithm implementations (CFRPlusSolver, DeepCFR, KuhnCFRSolver)
- abstraction: Game tree compression (HandBucketing, ActionAbstraction)
- training: Training utilities (Trainer, ValueNetwork, ONNX export)

Usage:
	# Train Kuhn Poker (validates CFR implementation)
	python -m src.cli train --solver kuhn --iterations 100000

	# Train tabular CFR+ for Heads-Up NLHE
	python -m src.cli train --solver tabular --iterations 10000

	# Train Deep CFR (with GPU acceleration)
	python -m src.cli train --solver deep --iterations 100 --device cuda

	# Export trained model to ONNX for TypeScript inference
	# (See training/onnx_export.py)
"""

__version__ = '0.2.0'
