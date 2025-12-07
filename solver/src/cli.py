#!/usr/bin/env python3
"""
Command-line interface for CFR solver.

Usage:
	python -m src.cli train --solver kuhn --iterations 100000
	python -m src.cli train --solver tabular --iterations 10000
	python -m src.cli train --solver deep --iterations 100
	python -m src.cli export --model checkpoints/deep_cfr_model.pt --output models/
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
	train_parser.add_argument(
		'--export-onnx',
		action='store_true',
		help='Export to ONNX after training (Deep CFR only)'
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

	# Export command
	export_parser = subparsers.add_parser(
		'export',
		help='Export trained model to ONNX'
	)
	export_parser.add_argument(
		'--model',
		type=str,
		required=True,
		help='Path to trained PyTorch model (.pt file)'
	)
	export_parser.add_argument(
		'--output',
		type=str,
		default='models',
		help='Output directory for ONNX files'
	)
	export_parser.add_argument(
		'--device',
		type=str,
		default='cpu',
		help='Device to load model on'
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

		# Export to ONNX if requested (Deep CFR only)
		if args.export_onnx and args.solver == 'deep':
			print('\nExporting to ONNX...')
			exported = trainer.solver.export_to_onnx(args.output)
			print(f'Exported models: {list(exported.keys())}')

	elif args.command == 'validate':
		trainer = create_cfr_trainer(solver_type='kuhn')
		trainer.train(iterations=args.iterations)
		results = trainer.validate_kuhn()
		print(f'\nValidation results: {results}')

	elif args.command == 'export':
		from .cfr.deep_cfr import DeepCFR
		from .training.onnx_export import verify_onnx_model, test_onnx_inference

		print(f'Loading model from {args.model}...')
		solver = DeepCFR(device=args.device)
		solver.load(args.model)

		print(f'Exporting to {args.output}...')
		exported = solver.export_to_onnx(args.output)

		# Verify exported models
		print('\nVerifying exported models...')
		for name, path in exported.items():
			if path.endswith('.onnx'):
				is_valid = verify_onnx_model(path)
				if is_valid:
					test_onnx_inference(path)

		print(f'\nExport complete! Models saved to {args.output}')
		print('Use strategy_network_latest.onnx for TypeScript inference.')

	else:
		parser.print_help()
		sys.exit(1)


if __name__ == '__main__':
	main()

