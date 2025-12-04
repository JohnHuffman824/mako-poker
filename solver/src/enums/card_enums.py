"""
Card enums: Rank and Suit.

These match the Kotlin CardEnums.kt definitions for cross-language consistency.
"""

from enum import Enum


class Rank(Enum):
    """
    Playing card ranks from lowest (TWO=2) to highest (ACE=14).
    Numeric value used for hand evaluation and comparisons.
    """
    TWO = (2, '2')
    THREE = (3, '3')
    FOUR = (4, '4')
    FIVE = (5, '5')
    SIX = (6, '6')
    SEVEN = (7, '7')
    EIGHT = (8, '8')
    NINE = (9, '9')
    TEN = (10, 'T')
    JACK = (11, 'J')
    QUEEN = (12, 'Q')
    KING = (13, 'K')
    ACE = (14, 'A')

    def __init__(self, value: int, symbol: str):
        self._value = value
        self._symbol = symbol

    @property
    def value(self) -> int:
        return self._value

    @property
    def symbol(self) -> str:
        return self._symbol

    @classmethod
    def from_symbol(cls, symbol: str) -> 'Rank':
        """Creates Rank from symbol string (e.g., 'A', 'T', '2')."""
        symbol_upper = symbol.upper()
        for rank in cls:
            if rank.symbol == symbol_upper:
                return rank
        raise ValueError(f'Invalid rank symbol: {symbol}')

    @classmethod
    def from_value(cls, value: int) -> 'Rank':
        """Creates Rank from numeric value (2-14)."""
        for rank in cls:
            if rank.value == value:
                return rank
        raise ValueError(f'Invalid rank value: {value}')


class Suit(Enum):
    """
    Playing card suits.
    Suits have equal value in standard poker (no suit ranking).
    """
    SPADES = ('s', 'spades')
    HEARTS = ('h', 'hearts')
    DIAMONDS = ('d', 'diamonds')
    CLUBS = ('c', 'clubs')

    def __init__(self, symbol: str, display_name: str):
        self._symbol = symbol
        self._display_name = display_name

    @property
    def symbol(self) -> str:
        return self._symbol

    @property
    def display_name(self) -> str:
        return self._display_name

    @classmethod
    def from_symbol(cls, symbol: str) -> 'Suit':
        """Creates Suit from single character symbol (s, h, d, c)."""
        symbol_lower = symbol.lower()
        for suit in cls:
            if suit.symbol == symbol_lower:
                return suit
        raise ValueError(
            f'Invalid suit symbol: {symbol}. Expected: s, h, d, or c'
        )

    @classmethod
    def from_display_name(cls, name: str) -> 'Suit':
        """Creates Suit from display name (spades, hearts, diamonds, clubs)."""
        name_lower = name.lower()
        for suit in cls:
            if suit.display_name == name_lower:
                return suit
        raise ValueError(
            f'Invalid suit name: {name}. '
            'Expected: spades, hearts, diamonds, or clubs'
        )

