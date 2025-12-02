#!/usr/bin/env python3
"""
Export trained CFR solutions to binary format for Kotlin backend.

Usage:
    python export_solutions.py --input checkpoint.pkl --output solutions.gto
"""

import argparse
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))


def main():
    parser = argparse.ArgumentParser(
        description='Export CFR solutions to binary format'
    )
    parser.add_argument(
        '--input',
        type=str,
        required=True,
        help='Input checkpoint file'
    )
    parser.add_argument(
        '--output',
        type=str,
        required=True,
        help='Output .gto file'
    )
    args = parser.parse_args()

    print(f'Exporting solutions from {args.input} to {args.output}')

    # TODO: Implement solution export
    print('Export functionality not yet implemented')


if __name__ == '__main__':
    main()

