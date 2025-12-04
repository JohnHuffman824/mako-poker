"""
Hand evaluator for poker.

Evaluates poker hands using standard Texas Hold'em rules.
Returns absolute rankings from 1-7462 where higher is better.

Ported from Kotlin HandEvaluator.kt
"""

from dataclasses import dataclass
from itertools import combinations
from typing import Optional

from .card import Card
from .hand_rankings import HandType, HandRankingConstants


@dataclass
class HandResult:
		"""
		Result of hand evaluation with standardized ranking.

		Attributes:
				absolute_rank: Ranking from 1-7462 (higher = better)
				hand_type: The category of hand (pair, flush, etc.)
				description: Human-readable description of the hand
		"""
		absolute_rank: int
		hand_type: HandType
		description: str

		@property
		def hand_name(self) -> str:
				"""Display name for the hand type."""
				return self.hand_type.display_name

		def __lt__(self, other: 'HandResult') -> bool:
				return self.absolute_rank < other.absolute_rank

		def __le__(self, other: 'HandResult') -> bool:
				return self.absolute_rank <= other.absolute_rank

		def __gt__(self, other: 'HandResult') -> bool:
				return self.absolute_rank > other.absolute_rank

		def __ge__(self, other: 'HandResult') -> bool:
				return self.absolute_rank >= other.absolute_rank


class HandEvaluator:
		"""
		Evaluates poker hands using standard Texas Hold'em rules.

		Returns absolute rankings from 1-7462 where higher is better.
		This standardized ranking allows direct comparison between any two hands.
		"""

		@staticmethod
		def evaluate(
				hole_cards: list[Card],
				community_cards: list[Card]
		) -> HandResult:
				"""
				Evaluates best 5-card hand from available cards.
				Supports 5, 6, or 7 card inputs.

				Args:
						hole_cards: Player's hole cards (2 cards)
						community_cards: Community cards (3-5 cards)

				Returns:
						HandResult with absolute ranking
				"""
				all_cards = hole_cards + community_cards
				if not (5 <= len(all_cards) <= 7):
						raise ValueError(
								f'Must have 5-7 cards, got {len(all_cards)}'
						)

				# Generate all 5-card combinations and find best
				best_result: Optional[HandResult] = None
				for combo in combinations(all_cards, 5):
						result = HandEvaluator._evaluate_five_cards(list(combo))
						if best_result is None or result > best_result:
								best_result = result

				if best_result is None:
						raise RuntimeError('No valid hand found')

				return best_result

		@staticmethod
		def _evaluate_five_cards(cards: list[Card]) -> HandResult:
				"""Evaluates a specific 5-card hand."""
				values = sorted([c.rank.value for c in cards])
				suits = [c.suit for c in cards]
				value_counts = {}
				for v in values:
						value_counts[v] = value_counts.get(v, 0) + 1

				is_flush = len(set(suits)) == 1
				is_straight = HandEvaluator._check_straight(values)
				is_wheel = values == [2, 3, 4, 5, 14]  # A-2-3-4-5

				# Straight flush (includes royal flush)
				if is_flush and is_straight:
						high_card = 5 if is_wheel else values[-1]
						rank_within_type = HandEvaluator._calculate_straight_flush_rank(
								high_card
						)
						return HandResult(
								absolute_rank=(
										HandRankingConstants.HAND_TYPE_BASE_RANKS[
												HandType.STRAIGHT_FLUSH
										] + rank_within_type
								),
								hand_type=HandType.STRAIGHT_FLUSH,
								description=(
										'Royal Flush' if high_card == 14
										else f'Straight Flush, {_rank_to_name(high_card)} high'
								)
						)

				# Four of a kind
				four_of_kind = _find_count(value_counts, 4)
				if four_of_kind is not None:
						kicker = next(v for v in values if v != four_of_kind)
						rank_within_type = HandEvaluator._calculate_four_of_kind_rank(
								four_of_kind, kicker
						)
						return HandResult(
								absolute_rank=(
										HandRankingConstants.HAND_TYPE_BASE_RANKS[
												HandType.FOUR_OF_A_KIND
										] + rank_within_type
								),
								hand_type=HandType.FOUR_OF_A_KIND,
								description=f'Four of a Kind, {_rank_to_name(four_of_kind)}s'
						)

				# Full house
				three_of_kind = _find_count(value_counts, 3)
				pair = _find_count(value_counts, 2)
				if three_of_kind is not None and pair is not None:
						rank_within_type = HandEvaluator._calculate_full_house_rank(
								three_of_kind, pair
						)
						return HandResult(
								absolute_rank=(
										HandRankingConstants.HAND_TYPE_BASE_RANKS[
												HandType.FULL_HOUSE
										] + rank_within_type
								),
								hand_type=HandType.FULL_HOUSE,
								description=(
										f'Full House, {_rank_to_name(three_of_kind)}s '
										f'full of {_rank_to_name(pair)}s'
								)
						)

				# Flush
				if is_flush:
						rank_within_type = HandEvaluator._calculate_flush_rank(values)
						return HandResult(
								absolute_rank=(
										HandRankingConstants.HAND_TYPE_BASE_RANKS[HandType.FLUSH]
										+ rank_within_type
								),
								hand_type=HandType.FLUSH,
								description=f'Flush, {_rank_to_name(values[-1])} high'
						)

				# Straight
				if is_straight:
						high_card = 5 if is_wheel else values[-1]
						rank_within_type = HandEvaluator._calculate_straight_rank(high_card)
						return HandResult(
								absolute_rank=(
										HandRankingConstants.HAND_TYPE_BASE_RANKS[HandType.STRAIGHT]
										+ rank_within_type
								),
								hand_type=HandType.STRAIGHT,
								description=f'Straight, {_rank_to_name(high_card)} high'
						)

				# Three of a kind
				if three_of_kind is not None:
						kickers = sorted(
								[v for v in values if v != three_of_kind],
								reverse=True
						)
						rank_within_type = HandEvaluator._calculate_three_of_kind_rank(
								three_of_kind, kickers
						)
						return HandResult(
								absolute_rank=(
										HandRankingConstants.HAND_TYPE_BASE_RANKS[
												HandType.THREE_OF_A_KIND
										] + rank_within_type
								),
								hand_type=HandType.THREE_OF_A_KIND,
								description=f'Three of a Kind, {_rank_to_name(three_of_kind)}s'
						)

				# Two pair
				pairs = sorted(
						[v for v, count in value_counts.items() if count == 2],
						reverse=True
				)
				if len(pairs) == 2:
						kicker = next(v for v in values if v not in pairs)
						rank_within_type = HandEvaluator._calculate_two_pair_rank(
								pairs[0], pairs[1], kicker
						)
						return HandResult(
								absolute_rank=(
										HandRankingConstants.HAND_TYPE_BASE_RANKS[HandType.TWO_PAIR]
										+ rank_within_type
								),
								hand_type=HandType.TWO_PAIR,
								description=(
										f'Two Pair, {_rank_to_name(pairs[0])}s and '
										f'{_rank_to_name(pairs[1])}s'
								)
						)

				# One pair
				if len(pairs) == 1:
						kickers = sorted(
								[v for v in values if v != pairs[0]],
								reverse=True
						)
						rank_within_type = HandEvaluator._calculate_one_pair_rank(
								pairs[0], kickers
						)
						return HandResult(
								absolute_rank=(
										HandRankingConstants.HAND_TYPE_BASE_RANKS[HandType.ONE_PAIR]
										+ rank_within_type
								),
								hand_type=HandType.ONE_PAIR,
								description=f'Pair of {_rank_to_name(pairs[0])}s'
						)

				# High card
				rank_within_type = HandEvaluator._calculate_high_card_rank(values)
				return HandResult(
						absolute_rank=rank_within_type,
						hand_type=HandType.HIGH_CARD,
						description=f'High Card, {_rank_to_name(values[-1])}'
				)

		@staticmethod
		def _check_straight(values: list[int]) -> bool:
				"""
				Checks if 5 cards form a straight.
				Handles special case of A-2-3-4-5 (wheel).
				"""
				sorted_values = sorted(values)

				# Normal straight: consecutive values
				if (sorted_values[-1] - sorted_values[0] == 4 and
								len(set(sorted_values)) == 5):
						return True

				# Wheel (A-2-3-4-5): Ace acts as 1
				if sorted_values == [2, 3, 4, 5, 14]:
						return True

				return False

		@staticmethod
		def _encode_card_values(values: list[int]) -> int:
				"""
				Encodes a list of card values into a single comparable number.
				Uses base-15 encoding to ensure each position is distinct.
				"""
				encoded = 0
				for i, v in enumerate(values):
						power = len(values) - 1 - i
						encoded += v * (15 ** power)
				return encoded

		@staticmethod
		def _normalize_to_range(
				encoded: int,
				min_possible: int,
				max_possible: int,
				target_min: int,
				target_max: int
		) -> int:
				"""
				Normalizes an encoded value to fit within a rank range.
				Maps the full encoded space proportionally to the target range.
				"""
				if max_possible < min_possible:
						raise ValueError(
								f'Invalid range: max ({max_possible}) < min ({min_possible})'
						)

				if max_possible == min_possible:
						return target_min

				proportion = (encoded - min_possible) / (max_possible - min_possible)
				range_size = target_max - target_min

				return target_min + int(proportion * range_size)

		@staticmethod
		def _calculate_high_card_rank(values: list[int]) -> int:
				sorted_vals = sorted(values, reverse=True)
				encoded = HandEvaluator._encode_card_values(sorted_vals)

				# Min: [7,5,4,3,2] = lowest high card
				# Max: [14,13,12,11,9] = highest high card (no straight)
				min_encoded = HandEvaluator._encode_card_values([7, 5, 4, 3, 2])
				max_encoded = HandEvaluator._encode_card_values([14, 13, 12, 11, 9])

				return HandEvaluator._normalize_to_range(
						encoded, min_encoded, max_encoded, 1, 1277
				)

		@staticmethod
		def _calculate_one_pair_rank(pair_value: int, kickers: list[int]) -> int:
				# Encode: pair value + 3 kickers
				values = [pair_value] + sorted(kickers[:3], reverse=True)
				encoded = HandEvaluator._encode_card_values(values)

				# Min: Pair of 2s with 5-4-3 kickers
				# Max: Pair of Aces with K-Q-J kickers
				min_encoded = HandEvaluator._encode_card_values([2, 5, 4, 3])
				max_encoded = HandEvaluator._encode_card_values([14, 13, 12, 11])

				return HandEvaluator._normalize_to_range(
						encoded, min_encoded, max_encoded, 1, 2860
				)

		@staticmethod
		def _calculate_two_pair_rank(
				high_pair: int,
				low_pair: int,
				kicker: int
		) -> int:
				values = [high_pair, low_pair, kicker]
				encoded = HandEvaluator._encode_card_values(values)

				# Min: 3-2 with 4 kicker
				# Max: A-K with Q kicker
				min_encoded = HandEvaluator._encode_card_values([3, 2, 4])
				max_encoded = HandEvaluator._encode_card_values([14, 13, 12])

				return HandEvaluator._normalize_to_range(
						encoded, min_encoded, max_encoded, 1, 858
				)

		@staticmethod
		def _calculate_three_of_kind_rank(
				trips_value: int,
				kickers: list[int]
		) -> int:
				values = [trips_value] + sorted(kickers[:2], reverse=True)
				encoded = HandEvaluator._encode_card_values(values)

				# Min: Trip 2s with 5-4 kickers
				# Max: Trip Aces with K-Q kickers
				min_encoded = HandEvaluator._encode_card_values([2, 5, 4])
				max_encoded = HandEvaluator._encode_card_values([14, 13, 12])

				return HandEvaluator._normalize_to_range(
						encoded, min_encoded, max_encoded, 1, 858
				)

		@staticmethod
		def _calculate_straight_rank(high_card: int) -> int:
				# 10 possible straights (5-high through A-high)
				if not (5 <= high_card <= 14):
						raise ValueError(f'Invalid straight high card: {high_card}')
				return 1 if high_card == 5 else (high_card - 4)

		@staticmethod
		def _calculate_flush_rank(values: list[int]) -> int:
				sorted_vals = sorted(values, reverse=True)
				encoded = HandEvaluator._encode_card_values(sorted_vals)

				# Same as high card
				min_encoded = HandEvaluator._encode_card_values([7, 5, 4, 3, 2])
				max_encoded = HandEvaluator._encode_card_values([14, 13, 12, 11, 9])

				return HandEvaluator._normalize_to_range(
						encoded, min_encoded, max_encoded, 1, 1277
				)

		@staticmethod
		def _calculate_full_house_rank(trips: int, pair: int) -> int:
				values = [trips, pair]
				encoded = HandEvaluator._encode_card_values(values)

				# Min: 2-2-2-3-3 (trip 2s over 3s)
				# Max: A-A-A-K-K (trip Aces over Kings)
				min_encoded = HandEvaluator._encode_card_values([2, 3])
				max_encoded = HandEvaluator._encode_card_values([14, 13])

				return HandEvaluator._normalize_to_range(
						encoded, min_encoded, max_encoded, 1, 156
				)

		@staticmethod
		def _calculate_four_of_kind_rank(quads: int, kicker: int) -> int:
				values = [quads, kicker]
				encoded = HandEvaluator._encode_card_values(values)

				# Min: 2-2-2-2-3 (quad 2s with 3 kicker)
				# Max: A-A-A-A-K (quad Aces with K kicker)
				min_encoded = HandEvaluator._encode_card_values([2, 3])
				max_encoded = HandEvaluator._encode_card_values([14, 13])

				return HandEvaluator._normalize_to_range(
						encoded, min_encoded, max_encoded, 1, 156
				)

		@staticmethod
		def _calculate_straight_flush_rank(high_card: int) -> int:
				# 10 possible (5-high through A-high)
				if not (5 <= high_card <= 14):
						raise ValueError(f'Invalid straight flush high card: {high_card}')
				return 1 if high_card == 5 else (high_card - 4)


def _find_count(value_counts: dict[int, int], count: int) -> Optional[int]:
		"""Find a value with the specified count."""
		for v, c in value_counts.items():
				if c == count:
						return v
		return None


def _rank_to_name(value: int) -> str:
		"""Converts numeric rank value to display name."""
		names = {
				14: 'Ace',
				13: 'King',
				12: 'Queen',
				11: 'Jack',
				10: 'Ten',
		}
		return names.get(value, str(value))

