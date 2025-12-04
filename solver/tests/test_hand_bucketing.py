"""
Tests for hand bucketing abstraction.
"""

import unittest
import sys
from pathlib import Path

# Add solver root to path so 'src' is a package
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.game.card import Card, cards_from_string
from src.abstraction.hand_bucketing import HandBucketing


class TestPreflopBucketing(unittest.TestCase):
	"""Tests for preflop hand bucketing."""

	def setUp(self):
		self.bucketing = HandBucketing(preflop_buckets=169)

	def test_pocket_aces_same_bucket(self):
		"""All pocket aces should be in same bucket."""
		hands = [
			cards_from_string('As Ah'),
			cards_from_string('Ac Ad'),
			cards_from_string('Ah Ac'),
		]

		buckets = [self.bucketing.get_bucket(h) for h in hands]
		self.assertEqual(len(set(buckets)), 1)

	def test_suited_vs_offsuit_different(self):
		"""Suited and offsuit hands should be different buckets."""
		suited = cards_from_string('As Ks')
		offsuit = cards_from_string('As Kh')

		bucket_s = self.bucketing.get_bucket(suited)
		bucket_o = self.bucketing.get_bucket(offsuit)

		self.assertNotEqual(bucket_s, bucket_o)

	def test_equivalent_hands_same_bucket(self):
		"""Equivalent hands (same ranks, suited/offsuit) in same bucket."""
		hand1 = cards_from_string('As Kh')
		hand2 = cards_from_string('Ad Kc')

		bucket1 = self.bucketing.get_bucket(hand1)
		bucket2 = self.bucketing.get_bucket(hand2)

		self.assertEqual(bucket1, bucket2)

	def test_bucket_in_valid_range(self):
		"""Bucket should be in valid range."""
		hand = cards_from_string('7h 2c')
		bucket = self.bucketing.get_bucket(hand)

		self.assertGreaterEqual(bucket, 0)
		self.assertLess(bucket, 169)

	def test_premium_hands_low_buckets(self):
		"""Premium hands should have low bucket numbers."""
		aces = cards_from_string('As Ah')
		seventy_two = cards_from_string('7h 2c')

		bucket_aa = self.bucketing.get_bucket(aces)
		bucket_72 = self.bucketing.get_bucket(seventy_two)

		# AA should be in a lower (better) bucket than 72o
		self.assertLess(bucket_aa, bucket_72)


class TestPostflopBucketing(unittest.TestCase):
	"""Tests for postflop equity-based bucketing."""

	def setUp(self):
		# Use fewer samples for faster tests
		self.bucketing = HandBucketing(
			postflop_buckets=10,
			equity_samples=100
		)

	def test_strong_hand_high_bucket(self):
		"""Strong hands should get higher buckets."""
		# Top pair with flush draw on wet board
		hole = cards_from_string('Ah Kh')
		board = cards_from_string('Kc 5h 2h')

		bucket = self.bucketing.get_bucket(hole, board)

		# Should be in upper half of buckets
		self.assertGreaterEqual(bucket, 5)

	def test_weak_hand_low_bucket(self):
		"""Weak hands should get lower buckets."""
		# No pair, no draw
		hole = cards_from_string('7c 2s')
		board = cards_from_string('Ah Kd Qc')

		bucket = self.bucketing.get_bucket(hole, board)

		# Should be in lower half of buckets
		self.assertLess(bucket, 5)

	def test_bucket_consistency(self):
		"""Same hand/board should give consistent bucket (with variance)."""
		hole = cards_from_string('As Ks')
		board = cards_from_string('Ac Tc 5d')

		# Due to Monte Carlo randomness, may vary slightly
		buckets = [self.bucketing.get_bucket(hole, board) for _ in range(5)]

		# All buckets should be close (within 2)
		self.assertLessEqual(max(buckets) - min(buckets), 3)


class TestBucketingConfiguration(unittest.TestCase):
	"""Tests for bucketing configuration."""

	def test_custom_preflop_buckets(self):
		"""Should respect custom preflop bucket count."""
		bucketing = HandBucketing(preflop_buckets=10)
		hand = cards_from_string('As Ah')
		bucket = bucketing.get_bucket(hand)

		self.assertGreaterEqual(bucket, 0)
		self.assertLess(bucket, 10)

	def test_properties(self):
		"""Should expose bucket counts."""
		bucketing = HandBucketing(preflop_buckets=50, postflop_buckets=15)

		self.assertEqual(bucketing.num_preflop_buckets, 50)
		self.assertEqual(bucketing.num_postflop_buckets, 15)


if __name__ == '__main__':
	unittest.main()

