"""
Card-related enums: Rank and Suit.

These match the Kotlin CardEnums.kt definitions for cross-language consistency.
"""

from enum import Enum


class RankEnum(str, Enum):
    """
    Playing card ranks from lowest (TWO=2) to highest (ACE=14).

    The string values match the symbol used in card notation (e.g., 'As' for Ace).
    Numeric values are available via the `numeric_value` property for comparisons.
    """
    TWO = '2'
    THREE = '3'
    FOUR = '4'
    FIVE = '5'
    SIX = '6'
    SEVEN = '7'
    EIGHT = '8'
    NINE = '9'
    TEN = 'T'
    JACK = 'J'
    QUEEN = 'Q'
    KING = 'K'
    ACE = 'A'

    @property
    def numeric_value(self) -> int:
        """Numeric value for hand evaluation (2-14)."""
        values = {
            '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
            '9': 9, 'T': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14
        }
        return values[self.value]

    @classmethod
    def from_symbol(cls, symbol: str) -> 'RankEnum':
        """Create Rank from symbol string (case-insensitive)."""
        upper = symbol.upper()
        for rank in cls:
            if rank.value == upper:
                return rank
        raise ValueError(f'Invalid rank symbol: {symbol}')

    @classmethod
    def from_numeric(cls, value: int) -> 'RankEnum':
        """Create Rank from numeric value (2-14)."""
        for rank in cls:
            if rank.numeric_value == value:
                return rank
        raise ValueError(f'Invalid rank value: {value}')


class SuitEnum(str, Enum):
    """
    Playing card suits.

    Suits have equal value in standard poker (no suit ranking).
    The string values are single lowercase characters for notation.
    """
    SPADES = 's'
    HEARTS = 'h'
    DIAMONDS = 'd'
    CLUBS = 'c'

    @property
    def display_name(self) -> str:
        """Full display name (e.g., 'spades')."""
        return self.name.lower()

    @classmethod
    def from_symbol(cls, symbol: str) -> 'SuitEnum':
        """Create Suit from symbol (case-insensitive)."""
        lower = symbol.lower()
        for suit in cls:
            if suit.value == lower:
                return suit
        raise ValueError(f'Invalid suit symbol: {symbol}')

    @classmethod
    def from_display_name(cls, name: str) -> 'SuitEnum':
        """Create Suit from display name (case-insensitive)."""
        lower = name.lower()
        for suit in cls:
            if suit.display_name == lower:
                return suit
        raise ValueError(f'Invalid suit name: {name}')

