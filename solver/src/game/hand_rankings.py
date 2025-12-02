"""
Hand rankings and constants for poker hand evaluation.

Based on the 7,462 unique 5-card poker hands:
- Rank 1 = Weakest (7-5-4-3-2 unsuited)
- Rank 7462 = Strongest (Royal Flush)

Ported from Kotlin HandRankings.kt
"""

from enum import Enum


class HandType(Enum):
    """
    Hand type categories with their absolute rank ranges.

    These ranges are derived from the mathematical enumeration of all
    distinguishable 5-card poker hands from a standard 52-card deck.
    """
    HIGH_CARD = (1, 1277, 'High Card')
    ONE_PAIR = (1278, 4137, 'Pair')
    TWO_PAIR = (4138, 4995, 'Two Pair')
    THREE_OF_A_KIND = (4996, 5853, 'Three of a Kind')
    STRAIGHT = (5854, 5863, 'Straight')
    FLUSH = (5864, 7140, 'Flush')
    FULL_HOUSE = (7141, 7296, 'Full House')
    FOUR_OF_A_KIND = (7297, 7452, 'Four of a Kind')
    STRAIGHT_FLUSH = (7453, 7462, 'Straight Flush')

    def __init__(self, min_rank: int, max_rank: int, display_name: str):
        self._min_rank = min_rank
        self._max_rank = max_rank
        self._display_name = display_name

    @property
    def min_rank(self) -> int:
        return self._min_rank

    @property
    def max_rank(self) -> int:
        return self._max_rank

    @property
    def display_name(self) -> str:
        return self._display_name

    def __contains__(self, rank: int) -> bool:
        """Check if a rank falls within this hand type's range."""
        return self._min_rank <= rank <= self._max_rank

    @classmethod
    def from_rank(cls, rank: int) -> 'HandType':
        """
        Determines hand type from an absolute rank value.

        Args:
            rank: The absolute rank (1-7462)

        Returns:
            The corresponding HandType

        Raises:
            ValueError: if rank is out of range
        """
        if not (1 <= rank <= 7462):
            raise ValueError(f'Invalid hand rank: {rank} (must be 1-7462)')

        for hand_type in cls:
            if rank in hand_type:
                return hand_type

        raise ValueError(f'No hand type found for rank: {rank}')


class HandRankingConstants:
    """Constants for hand ranking calculations."""

    # Minimum possible hand rank (7-high)
    MIN_HAND_RANK = 1

    # Maximum possible hand rank (Royal Flush)
    MAX_HAND_RANK = 7462

    # Total number of unique 5-card hand rankings
    TOTAL_DISTINCT_HANDS = 7462

    # Base rank values for calculating absolute hand ranking
    # Each hand type starts after the previous type's range ends
    HAND_TYPE_BASE_RANKS = {
        HandType.HIGH_CARD: 0,
        HandType.ONE_PAIR: 1277,
        HandType.TWO_PAIR: 4137,
        HandType.THREE_OF_A_KIND: 4995,
        HandType.STRAIGHT: 5853,
        HandType.FLUSH: 5863,
        HandType.FULL_HOUSE: 7140,
        HandType.FOUR_OF_A_KIND: 7296,
        HandType.STRAIGHT_FLUSH: 7452,
    }

    # Number of distinct hands within each category
    HAND_TYPE_COUNTS = {
        HandType.HIGH_CARD: 1277,
        HandType.ONE_PAIR: 2860,
        HandType.TWO_PAIR: 858,
        HandType.THREE_OF_A_KIND: 858,
        HandType.STRAIGHT: 10,
        HandType.FLUSH: 1277,
        HandType.FULL_HOUSE: 156,
        HandType.FOUR_OF_A_KIND: 156,
        HandType.STRAIGHT_FLUSH: 10,
    }

