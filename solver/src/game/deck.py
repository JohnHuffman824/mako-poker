"""
Deck of playing cards for poker.
"""

import random
from typing import Optional

from .card import Card
from ..enums import Rank, Suit


class Deck:
		"""
		Standard 52-card deck for poker.
		Supports shuffling, dealing, and removing specific cards.
		"""

		def __init__(self, exclude: Optional[list[Card]] = None):
				"""
				Initialize a new deck.

				Args:
						exclude: Cards to exclude from the deck (for partial deals)
				"""
				self._cards: list[Card] = []
				exclude_set = set(exclude) if exclude else set()

				for suit in Suit:
						for rank in Rank:
								card = Card(rank=rank, suit=suit)
								if card not in exclude_set:
										self._cards.append(card)

		def __len__(self) -> int:
				return len(self._cards)

		def __contains__(self, card: Card) -> bool:
				return card in self._cards

		def shuffle(self) -> 'Deck':
				"""Shuffle the deck in place. Returns self for chaining."""
				random.shuffle(self._cards)
				return self

		def deal(self, n: int = 1) -> list[Card]:
				"""
				Deal n cards from the top of the deck.

				Args:
						n: Number of cards to deal

				Returns:
						List of dealt cards

				Raises:
						ValueError: if not enough cards remain
				"""
				if n > len(self._cards):
						raise ValueError(
								f'Cannot deal {n} cards, only {len(self._cards)} remain'
						)

				dealt = self._cards[:n]
				self._cards = self._cards[n:]
				return dealt

		def deal_one(self) -> Card:
				"""Deal a single card from the deck."""
				return self.deal(1)[0]

		def remove(self, cards: list[Card]) -> 'Deck':
				"""
				Remove specific cards from the deck.

				Args:
						cards: Cards to remove

				Returns:
						Self for chaining
				"""
				card_set = set(cards)
				self._cards = [c for c in self._cards if c not in card_set]
				return self

		def peek(self, n: int = 1) -> list[Card]:
				"""Look at the top n cards without removing them."""
				return self._cards[:n]

		@property
		def remaining(self) -> list[Card]:
				"""Returns a copy of remaining cards."""
				return self._cards.copy()

		def reset(self, exclude: Optional[list[Card]] = None) -> 'Deck':
				"""Reset deck to full 52 cards (or excluding specified cards)."""
				self.__init__(exclude=exclude)
				return self

		@classmethod
		def full(cls) -> 'Deck':
				"""Create a complete 52-card deck."""
				return cls()

		@classmethod
		def without(cls, cards: list[Card]) -> 'Deck':
				"""Create a deck excluding specific cards."""
				return cls(exclude=cards)

