"""
Card representation for poker.
"""

from dataclasses import dataclass

from ..enums import Rank, Suit


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
        Used internally for convenience, not exposed in API.
        """
        if len(notation) != 2:
            raise ValueError(f'Card notation must be 2 characters: {notation}')
        rank = Rank.from_symbol(notation[0])
        suit = Suit.from_symbol(notation[1])
        return cls(rank=rank, suit=suit)


def cards_from_string(s: str) -> list[Card]:
    """
    Parse multiple cards from a space-separated string.

    Args:
        s: Space-separated card notations (e.g., 'As Kh Qd')

    Returns:
        List of Card objects
    """
    return [Card.from_notation(c) for c in s.strip().split()]
