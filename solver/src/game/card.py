"""
Card representation for poker.

Ports the Kotlin CardEnums.kt and Card.kt to Python.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


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


@dataclass(frozen=True)
class Card:
    """
    Represents a playing card with type-safe rank and suit.
    Immutable to allow use in sets and as dict keys.
    """
    rank: Rank
    suit: Suit

    @property
    def notation(self) -> str:
        """Short notation for the card (e.g., 'As' for Ace of Spades)."""
        return f'{self.rank.symbol}{self.suit.symbol}'

    def __str__(self) -> str:
        return self.notation

    def __repr__(self) -> str:
        return f"Card('{self.notation}')"

    @classmethod
    def from_notation(cls, notation: str) -> 'Card':
        """
        Creates card from notation string (e.g., 'As', 'Th').

        Args:
            notation: Two-character string: rank + suit

        Returns:
            Card instance

        Raises:
            ValueError: if notation is invalid
        """
        if len(notation) != 2:
            raise ValueError(f'Card notation must be 2 characters: {notation}')

        rank = Rank.from_symbol(notation[0])
        suit = Suit.from_symbol(notation[1])
        return cls(rank=rank, suit=suit)

    @classmethod
    def from_string(cls, s: str) -> 'Card':
        """Alias for from_notation for convenience."""
        return cls.from_notation(s)


def cards_from_string(s: str) -> list[Card]:
    """
    Parse multiple cards from a space-separated string.

    Args:
        s: Space-separated card notations (e.g., 'As Kh Qd')

    Returns:
        List of Card objects
    """
    return [Card.from_notation(c) for c in s.strip().split()]

