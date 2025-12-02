#!/usr/bin/env python3
"""
Training script for CFR solver.

Usage:
    python train.py --iterations 100000 --output solutions/
"""

import argparse
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

from cfr import CFRPlusSolver
from abstraction import HandBucketing, ActionAbstraction


def main():
    parser = argparse.ArgumentParser(description='Train CFR solver')
    parser.add_argument(
        '--iterations',
        type=int,
        default=100000,
        help='Number of CFR iterations'
    )
    parser.add_argument(
        '--output',
        type=str,
        default='solutions/',
        help='Output directory for solutions'
    )
    parser.add_argument(
        '--checkpoint-every',
        type=int,
        default=10000,
        help='Save checkpoint every N iterations'
    )
    args = parser.parse_args()

    print(f'Starting CFR training for {args.iterations} iterations')

    hand_bucketing = HandBucketing()
    action_abstraction = ActionAbstraction()

    solver = CFRPlusSolver(
        hand_bucketing=hand_bucketing,
        action_abstraction=action_abstraction
    )

    solver.train(
        iterations=args.iterations,
        checkpoint_every=args.checkpoint_every,
        output_dir=args.output
    )

    print(f'Training complete. Solutions saved to {args.output}')


if __name__ == '__main__':
    main()

