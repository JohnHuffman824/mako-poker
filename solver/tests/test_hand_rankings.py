"""
Tests for hand rankings module.
"""

import unittest
import sys
from pathlib import Path

# Add solver root to path so 'src' is a package
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.game.hand_rankings import HandType, HandRankingConstants


class TestHandType(unittest.TestCase):
		"""Tests for HandType enum."""

		def test_hand_type_ordering(self):
				"""Hand types should be ordered by strength."""
				types = list(HandType)
				for i in range(len(types) - 1):
						self.assertLess(types[i].min_rank, types[i + 1].min_rank)

		def test_hand_type_ranges_contiguous(self):
				"""Hand type ranges should be contiguous."""
				types = list(HandType)
				for i in range(len(types) - 1):
						self.assertEqual(
								types[i].max_rank + 1,
								types[i + 1].min_rank
						)

		def test_hand_type_covers_all_ranks(self):
				"""Hand types should cover ranks 1-7462."""
				self.assertEqual(HandType.HIGH_CARD.min_rank, 1)
				self.assertEqual(HandType.STRAIGHT_FLUSH.max_rank, 7462)

		def test_from_rank(self):
				"""Should determine hand type from rank."""
				self.assertEqual(HandType.from_rank(1), HandType.HIGH_CARD)
				self.assertEqual(HandType.from_rank(1277), HandType.HIGH_CARD)
				self.assertEqual(HandType.from_rank(1278), HandType.ONE_PAIR)
				self.assertEqual(HandType.from_rank(7462), HandType.STRAIGHT_FLUSH)

		def test_from_rank_invalid(self):
				"""Invalid rank should raise ValueError."""
				with self.assertRaises(ValueError):
						HandType.from_rank(0)
				with self.assertRaises(ValueError):
						HandType.from_rank(7463)

		def test_contains(self):
				"""Hand type should support 'in' operator for ranks."""
				self.assertIn(1000, HandType.HIGH_CARD)
				self.assertNotIn(1000, HandType.ONE_PAIR)

		def test_display_names(self):
				"""Display names should be human readable."""
				self.assertEqual(HandType.HIGH_CARD.display_name, 'High Card')
				self.assertEqual(HandType.ONE_PAIR.display_name, 'Pair')
				self.assertEqual(HandType.STRAIGHT_FLUSH.display_name, 'Straight Flush')


class TestHandRankingConstants(unittest.TestCase):
		"""Tests for HandRankingConstants."""

		def test_min_max_ranks(self):
				"""Min and max rank constants should be correct."""
				self.assertEqual(HandRankingConstants.MIN_HAND_RANK, 1)
				self.assertEqual(HandRankingConstants.MAX_HAND_RANK, 7462)

		def test_total_hands(self):
				"""Total distinct hands should be 7462."""
				self.assertEqual(HandRankingConstants.TOTAL_DISTINCT_HANDS, 7462)

		def test_base_ranks_all_hand_types(self):
				"""Base ranks should be defined for all hand types."""
				for hand_type in HandType:
						self.assertIn(hand_type, HandRankingConstants.HAND_TYPE_BASE_RANKS)

		def test_hand_type_counts(self):
				"""Hand type counts should sum correctly."""
				total = sum(HandRankingConstants.HAND_TYPE_COUNTS.values())
				self.assertEqual(total, 7462)

		def test_hand_type_count_matches_range(self):
				"""Each hand type's count should match its rank range."""
				for hand_type, count in HandRankingConstants.HAND_TYPE_COUNTS.items():
						expected = hand_type.max_rank - hand_type.min_rank + 1
						self.assertEqual(count, expected)


if __name__ == '__main__':
		unittest.main()

