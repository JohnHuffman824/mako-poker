"""
Tests for hand evaluator module.

Ported from Kotlin HandEvaluatorTest.kt
"""

import unittest
import sys
from pathlib import Path

# Add solver root to path so 'src' is a package
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.game.card import Card, cards_from_string
from src.game.hand_rankings import HandType
from src.game.hand_evaluator import HandEvaluator


def cards(s: str) -> list[Card]:
	"""Helper to parse cards from string."""
	return cards_from_string(s)


def seven_cards(hole: str, board: str) -> tuple[list[Card], list[Card]]:
	"""Helper to parse hole cards and board."""
	return (cards(hole), cards(board))


class TestHandTypeRecognition(unittest.TestCase):
	"""Tests for recognizing all 9 hand types."""

	def test_recognizes_high_card(self):
		hole, board = seven_cards('Ah Kd', 'Qc Js 9h 8d 7c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.HIGH_CARD)
		self.assertIn(
			result.absolute_rank,
			range(HandType.HIGH_CARD.min_rank, HandType.HIGH_CARD.max_rank + 1)
		)

	def test_recognizes_one_pair(self):
		hole, board = seven_cards('Ah Ad', 'Kc Qs Jh 9d 8c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.ONE_PAIR)

	def test_recognizes_two_pair(self):
		hole, board = seven_cards('Ah Ad', 'Kc Ks Qh 9d 8c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.TWO_PAIR)

	def test_recognizes_three_of_kind(self):
		hole, board = seven_cards('Ah Ad', 'Ac Ks Qh 9d 8c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.THREE_OF_A_KIND)

	def test_recognizes_straight(self):
		hole, board = seven_cards('9h 8d', '7c 6s 5h Kd 2c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.STRAIGHT)

	def test_recognizes_flush(self):
		hole, board = seven_cards('Ah Kh', 'Qh Jh 9h 8d 2c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.FLUSH)

	def test_recognizes_full_house(self):
		hole, board = seven_cards('Ah Ad', 'Ac Ks Kh 9d 8c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.FULL_HOUSE)

	def test_recognizes_four_of_kind(self):
		hole, board = seven_cards('Ah Ad', 'Ac As Kh 9d 8c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.FOUR_OF_A_KIND)

	def test_recognizes_straight_flush(self):
		hole, board = seven_cards('9h 8h', '7h 6h 5h Kd 2c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.STRAIGHT_FLUSH)


class TestStraightEdgeCases(unittest.TestCase):
	"""Tests for straight edge cases."""

	def test_recognizes_wheel(self):
		"""A-2-3-4-5 (wheel) should be a straight."""
		hole, board = seven_cards('Ah 2d', '3c 4s 5h Kd 8c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.STRAIGHT)
		self.assertIn('Straight', result.description)

	def test_recognizes_broadway(self):
		"""T-J-Q-K-A (broadway) should be a straight."""
		hole, board = seven_cards('Ah Kd', 'Qc Js Th 8d 2c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.STRAIGHT)
		self.assertIn('Ace', result.description)

	def test_rejects_near_straight(self):
		"""A-2-3-4-6 should NOT be a straight."""
		hole, board = seven_cards('Ah 2d', '3c 4s 6h Kd 8c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertNotEqual(result.hand_type, HandType.STRAIGHT)

	def test_rejects_wrap_around(self):
		"""Q-K-A-2-3 should NOT be a straight."""
		hole, board = seven_cards('Qh Kd', 'Ac 2s 3h 8d 7c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertNotEqual(result.hand_type, HandType.STRAIGHT)


class TestKickerComparisons(unittest.TestCase):
	"""Tests for kicker comparisons using absolute rank."""

	def test_pair_kicker_comparison(self):
		"""AA-K-Q-J should beat AA-K-Q-T."""
		hole1, board1 = seven_cards('Ah Ad', 'Kc Qs Jh 9d 8c')
		hole2, board2 = seven_cards('As Ac', 'Kd Qh Th 9s 8d')

		result1 = HandEvaluator.evaluate(hole1, board1)
		result2 = HandEvaluator.evaluate(hole2, board2)

		self.assertGreater(result1.absolute_rank, result2.absolute_rank)

	def test_two_pair_kicker_comparison(self):
		"""AA-KK-Q should beat AA-KK-J."""
		hole1, board1 = seven_cards('Ah Ad', 'Kc Ks Qh 9d 8c')
		hole2, board2 = seven_cards('As Ac', 'Kd Kh Jh 9s 8d')

		result1 = HandEvaluator.evaluate(hole1, board1)
		result2 = HandEvaluator.evaluate(hole2, board2)

		self.assertGreater(result1.absolute_rank, result2.absolute_rank)

	def test_trips_kicker_comparison(self):
		"""AAA-K-Q should beat AAA-K-J."""
		hole1, board1 = seven_cards('Ah Ad', 'Ac Ks Qh 9d 8c')
		hole2, board2 = seven_cards('As Ac', 'Ah Kd Jh 9s 8d')

		result1 = HandEvaluator.evaluate(hole1, board1)
		result2 = HandEvaluator.evaluate(hole2, board2)

		self.assertGreater(result1.absolute_rank, result2.absolute_rank)

	def test_high_card_kicker_cascade(self):
		"""A-K-Q-J-9 should beat A-K-Q-J-8."""
		hole1, board1 = seven_cards('Ah Kd', 'Qc Js 9h 8d 2c')
		hole2, board2 = seven_cards('As Kc', 'Qd Jh 8h 7d 2s')

		result1 = HandEvaluator.evaluate(hole1, board1)
		result2 = HandEvaluator.evaluate(hole2, board2)

		self.assertGreater(result1.absolute_rank, result2.absolute_rank)

	def test_tied_hands(self):
		"""Identical hands should have same rank."""
		hole1, board1 = seven_cards('Ah Kd', 'Qc Js 9h 8d 2c')
		hole2, board2 = seven_cards('As Kc', 'Qd Jh 9s 8c 2d')

		result1 = HandEvaluator.evaluate(hole1, board1)
		result2 = HandEvaluator.evaluate(hole2, board2)

		self.assertEqual(result1.absolute_rank, result2.absolute_rank)

	def test_higher_pair_wins(self):
		"""AA should beat KK."""
		hole1, board1 = seven_cards('Ah Ad', 'Qc Js 9h 8d 7c')
		hole2, board2 = seven_cards('Ks Kc', 'Qd Jh 9s 8c 7d')

		result1 = HandEvaluator.evaluate(hole1, board1)
		result2 = HandEvaluator.evaluate(hole2, board2)

		self.assertGreater(result1.absolute_rank, result2.absolute_rank)

	def test_full_house_trips_comparison(self):
		"""AAA-KK should beat QQQ-AA."""
		hole1, board1 = seven_cards('Ah Ad', 'Ac Ks Kh 9d 8c')
		hole2, board2 = seven_cards('Qs Qc', 'Qd Ah As 9h 8d')

		result1 = HandEvaluator.evaluate(hole1, board1)
		result2 = HandEvaluator.evaluate(hole2, board2)

		self.assertGreater(result1.absolute_rank, result2.absolute_rank)


class TestBestHandSelection(unittest.TestCase):
	"""Tests for selecting best 5 cards from 7."""

	def test_hidden_flush(self):
		"""Should find flush when 5 cards make it."""
		hole, board = seven_cards('Ah Kh', 'Qh Jh 9h 8d 2c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.FLUSH)

	def test_full_house_beats_flush(self):
		"""Should prefer full house over possible flush."""
		hole, board = seven_cards('Ah Ad', 'Ac Kh Ks 9h 2h')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.FULL_HOUSE)

	def test_play_the_board(self):
		"""Should recognize when board is best hand."""
		hole, board = seven_cards('2h 3d', 'Ac Kc Qs Js Th')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.STRAIGHT)
		self.assertIn('Ace', result.description)


class TestCardCounts(unittest.TestCase):
	"""Tests for various card count scenarios."""

	def test_seven_cards(self):
		"""Should evaluate 7 cards (2 hole + 5 board)."""
		hole = cards('Ah Kd')
		board = cards('Qc Js 9h 8d 2c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.HIGH_CARD)

	def test_six_cards(self):
		"""Should evaluate 6 cards (turn)."""
		hole = cards('Ah Ad')
		board = cards('Kc Qs Jh 9d')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.ONE_PAIR)

	def test_five_cards(self):
		"""Should evaluate 5 cards (flop)."""
		hole = cards('Ah Ad')
		board = cards('Kc Qs Jh')
		result = HandEvaluator.evaluate(hole, board)
		self.assertEqual(result.hand_type, HandType.ONE_PAIR)


class TestHandTypeOrdering(unittest.TestCase):
	"""Tests for hand type ordering."""

	def test_hand_types_ordered_correctly(self):
		"""Each hand type should beat the previous."""
		hands = [
			seven_cards('Ah Kd', 'Qc Js 9h 8d 2c'),  # High card
			seven_cards('Ah Ad', 'Kc Qs Jh 9d 8c'),  # Pair
			seven_cards('Ah Ad', 'Kc Ks Qh 9d 8c'),  # Two pair
			seven_cards('Ah Ad', 'Ac Ks Qh 9d 8c'),  # Trips
			seven_cards('9h 8d', '7c 6s 5h Kd 2c'),  # Straight
			seven_cards('Ah Kh', 'Qh Jh 9h 8d 2c'),  # Flush
			seven_cards('Ah Ad', 'Ac Ks Kh 9d 8c'),  # Full house
			seven_cards('Ah Ad', 'Ac As Kh 9d 8c'),  # Quads
			seven_cards('9h 8h', '7h 6h 5h Kd 2c'),  # Straight flush
		]

		results = [HandEvaluator.evaluate(h[0], h[1]) for h in hands]

		for i in range(len(results) - 1):
			self.assertLess(
				results[i].absolute_rank,
				results[i + 1].absolute_rank,
				f'{results[i].hand_type} should rank lower than '
				f'{results[i + 1].hand_type}'
			)


class TestAbsoluteRankRange(unittest.TestCase):
	"""Tests for absolute rank validity."""

	def test_rank_within_valid_range(self):
		"""All hands should have rank 1-7462."""
		hole, board = seven_cards('Ah Kh', 'Qh Jh Th Kd 2c')
		result = HandEvaluator.evaluate(hole, board)
		self.assertGreaterEqual(result.absolute_rank, 1)
		self.assertLessEqual(result.absolute_rank, 7462)


if __name__ == '__main__':
	unittest.main()

