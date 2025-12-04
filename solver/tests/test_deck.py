"""
Tests for deck module.
"""

import unittest
import sys
from pathlib import Path

# Add solver root to path so 'src' is a package
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.game.card import Card
from src.game.deck import Deck


class TestDeck(unittest.TestCase):
	"""Tests for Deck class."""

	def test_deck_has_52_cards(self):
		"""A new deck should have 52 cards."""
		deck = Deck()
		self.assertEqual(len(deck), 52)

	def test_deck_has_unique_cards(self):
		"""All cards in deck should be unique."""
		deck = Deck()
		cards = deck.remaining
		card_set = set(cards)
		self.assertEqual(len(card_set), 52)

	def test_deal_removes_cards(self):
		"""Dealing should remove cards from deck."""
		deck = Deck()
		dealt = deck.deal(5)
		self.assertEqual(len(dealt), 5)
		self.assertEqual(len(deck), 47)

	def test_deal_one(self):
		"""deal_one should return single card."""
		deck = Deck()
		card = deck.deal_one()
		self.assertIsInstance(card, Card)
		self.assertEqual(len(deck), 51)

	def test_deal_too_many_raises_error(self):
		"""Dealing more cards than available should raise error."""
		deck = Deck()
		deck.deal(50)
		with self.assertRaises(ValueError):
			deck.deal(10)

	def test_shuffle_randomizes(self):
		"""Shuffle should randomize card order."""
		deck1 = Deck()
		deck2 = Deck()

		# Note: There's a tiny chance both are in same order
		# but probability is 1/52! ≈ 0
		deck1.shuffle()
		cards1 = deck1.remaining
		cards2 = deck2.remaining

		# Check at least some cards are in different positions
		different_count = sum(
			1 for c1, c2 in zip(cards1, cards2)
			if c1 != c2
		)
		self.assertGreater(different_count, 0)

	def test_shuffle_returns_self(self):
		"""Shuffle should return self for chaining."""
		deck = Deck()
		result = deck.shuffle()
		self.assertIs(result, deck)

	def test_remove_cards(self):
		"""Should be able to remove specific cards."""
		deck = Deck()
		ace_spades = Card.from_notation('As')
		king_hearts = Card.from_notation('Kh')

		deck.remove([ace_spades, king_hearts])

		self.assertEqual(len(deck), 50)
		self.assertNotIn(ace_spades, deck)
		self.assertNotIn(king_hearts, deck)

	def test_contains(self):
		"""Should check if card is in deck."""
		deck = Deck()
		ace_spades = Card.from_notation('As')
		self.assertIn(ace_spades, deck)

		deck.remove([ace_spades])
		self.assertNotIn(ace_spades, deck)

	def test_peek_does_not_remove(self):
		"""Peek should not remove cards."""
		deck = Deck()
		peeked = deck.peek(5)
		self.assertEqual(len(peeked), 5)
		self.assertEqual(len(deck), 52)

	def test_exclude_on_creation(self):
		"""Should be able to exclude cards on creation."""
		exclude = [Card.from_notation('As'), Card.from_notation('Kh')]
		deck = Deck(exclude=exclude)
		self.assertEqual(len(deck), 50)

	def test_reset(self):
		"""Reset should restore full deck."""
		deck = Deck()
		deck.deal(10)
		self.assertEqual(len(deck), 42)

		deck.reset()
		self.assertEqual(len(deck), 52)

	def test_without_factory(self):
		"""Deck.without should create deck excluding cards."""
		exclude = [Card.from_notation('As')]
		deck = Deck.without(exclude)
		self.assertEqual(len(deck), 51)
		self.assertNotIn(Card.from_notation('As'), deck)


if __name__ == '__main__':
	unittest.main()

