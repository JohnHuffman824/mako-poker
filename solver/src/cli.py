#!/usr/bin/env python3
"""
Command-line interface for CFR solver.

Usage:
		python -m src.cli train --solver kuhn --iterations 100000
		python -m src.cli train --solver tabular --iterations 10000
		python -m src.cli train --solver deep --iterations 100
"""

import argparse
import sys

from .training.trainer import create_cfr_trainer


def main():
		parser = argparse.ArgumentParser(
				description='CFR Poker Solver CLI'
		)
		subparsers = parser.add_subparsers(dest='command', help='Commands')

		# Train command
		train_parser = subparsers.add_parser('train', help='Train CFR solver')
		train_parser.add_argument(
				'--solver',
				type=str,
				choices=['kuhn', 'tabular', 'deep'],
				default='kuhn',
				help='Solver type'
		)
		train_parser.add_argument(
				'--iterations',
				type=int,
				default=100000,
				help='Number of iterations'
		)
		train_parser.add_argument(
				'--output',
				type=str,
				default='checkpoints',
				help='Output directory'
		)
		train_parser.add_argument(
				'--device',
				type=str,
				default=None,
				help='Device for Deep CFR (cuda/cpu)'
		)
		train_parser.add_argument(
				'--big-blind',
				type=int,
				default=2,
				help='Big blind size'
		)
		train_parser.add_argument(
				'--starting-stack',
				type=int,
				default=200,
				help='Starting stack'
		)

		# Validate command
		validate_parser = subparsers.add_parser(
				'validate',
				help='Validate Kuhn solution'
		)
		validate_parser.add_argument(
				'--iterations',
				type=int,
				default=100000,
				help='Training iterations before validation'
		)

		args = parser.parse_args()

		if args.command == 'train':
				trainer = create_cfr_trainer(
						solver_type=args.solver,
						output_dir=args.output,
						device=args.device,
						big_blind=args.big_blind,
						starting_stack=args.starting_stack
				)
				results = trainer.train(iterations=args.iterations)
				print(f'\nTraining complete: {results}')

		elif args.command == 'validate':
				trainer = create_cfr_trainer(solver_type='kuhn')
				trainer.train(iterations=args.iterations)
				results = trainer.validate_kuhn()
				print(f'\nValidation results: {results}')

		else:
				parser.print_help()
				sys.exit(1)


if __name__ == '__main__':
		main()

