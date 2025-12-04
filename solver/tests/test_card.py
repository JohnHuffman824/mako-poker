"""
Tests for card module.
"""

import unittest
import sys
from pathlib import Path

# Add solver root to path so 'src' is a package
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.enums import Rank, Suit
from src.game.card import Card, cards_from_string


class TestRank(unittest.TestCase):
		"""Tests for Rank enum."""

		def test_rank_values(self):
				"""Rank values should be 2-14."""
				self.assertEqual(Rank.TWO.value, 2)
				self.assertEqual(Rank.TEN.value, 10)
				self.assertEqual(Rank.JACK.value, 11)
				self.assertEqual(Rank.QUEEN.value, 12)
				self.assertEqual(Rank.KING.value, 13)
				self.assertEqual(Rank.ACE.value, 14)

		def test_rank_symbols(self):
				"""Rank symbols should match expected values."""
				self.assertEqual(Rank.TWO.symbol, '2')
				self.assertEqual(Rank.TEN.symbol, 'T')
				self.assertEqual(Rank.JACK.symbol, 'J')
				self.assertEqual(Rank.QUEEN.symbol, 'Q')
				self.assertEqual(Rank.KING.symbol, 'K')
				self.assertEqual(Rank.ACE.symbol, 'A')

		def test_from_symbol(self):
				"""Should create rank from symbol."""
				self.assertEqual(Rank.from_symbol('A'), Rank.ACE)
				self.assertEqual(Rank.from_symbol('K'), Rank.KING)
				self.assertEqual(Rank.from_symbol('T'), Rank.TEN)
				self.assertEqual(Rank.from_symbol('2'), Rank.TWO)

		def test_from_symbol_case_insensitive(self):
				"""Symbol lookup should be case insensitive."""
				self.assertEqual(Rank.from_symbol('a'), Rank.ACE)
				self.assertEqual(Rank.from_symbol('k'), Rank.KING)

		def test_from_symbol_invalid(self):
				"""Invalid symbol should raise ValueError."""
				with self.assertRaises(ValueError):
						Rank.from_symbol('X')

		def test_from_value(self):
				"""Should create rank from numeric value."""
				self.assertEqual(Rank.from_value(14), Rank.ACE)
				self.assertEqual(Rank.from_value(2), Rank.TWO)
				self.assertEqual(Rank.from_value(10), Rank.TEN)

		def test_from_value_invalid(self):
				"""Invalid value should raise ValueError."""
				with self.assertRaises(ValueError):
						Rank.from_value(1)
				with self.assertRaises(ValueError):
						Rank.from_value(15)


class TestSuit(unittest.TestCase):
		"""Tests for Suit enum."""

		def test_suit_symbols(self):
				"""Suit symbols should be single lowercase letters."""
				self.assertEqual(Suit.SPADES.symbol, 's')
				self.assertEqual(Suit.HEARTS.symbol, 'h')
				self.assertEqual(Suit.DIAMONDS.symbol, 'd')
				self.assertEqual(Suit.CLUBS.symbol, 'c')

		def test_suit_display_names(self):
				"""Suit display names should be full words."""
				self.assertEqual(Suit.SPADES.display_name, 'spades')
				self.assertEqual(Suit.HEARTS.display_name, 'hearts')

		def test_from_symbol(self):
				"""Should create suit from symbol."""
				self.assertEqual(Suit.from_symbol('s'), Suit.SPADES)
				self.assertEqual(Suit.from_symbol('h'), Suit.HEARTS)

		def test_from_symbol_case_insensitive(self):
				"""Symbol lookup should be case insensitive."""
				self.assertEqual(Suit.from_symbol('S'), Suit.SPADES)
				self.assertEqual(Suit.from_symbol('H'), Suit.HEARTS)

		def test_from_display_name(self):
				"""Should create suit from display name."""
				self.assertEqual(Suit.from_display_name('spades'), Suit.SPADES)
				self.assertEqual(Suit.from_display_name('HEARTS'), Suit.HEARTS)


class TestCard(unittest.TestCase):
		"""Tests for Card class."""

		def test_card_creation(self):
				"""Should create card with rank and suit."""
				card = Card(Rank.ACE, Suit.SPADES)
				self.assertEqual(card.rank, Rank.ACE)
				self.assertEqual(card.suit, Suit.SPADES)

		def test_card_notation(self):
				"""Card notation should be rank+suit symbols."""
				card = Card(Rank.ACE, Suit.SPADES)
				self.assertEqual(card.notation, 'As')

				card = Card(Rank.TEN, Suit.HEARTS)
				self.assertEqual(card.notation, 'Th')

		def test_from_notation(self):
				"""Should parse card from notation string."""
				card = Card.from_notation('As')
				self.assertEqual(card.rank, Rank.ACE)
				self.assertEqual(card.suit, Suit.SPADES)

				card = Card.from_notation('Th')
				self.assertEqual(card.rank, Rank.TEN)
				self.assertEqual(card.suit, Suit.HEARTS)

		def test_from_notation_invalid_length(self):
				"""Invalid notation length should raise ValueError."""
				with self.assertRaises(ValueError):
						Card.from_notation('A')
				with self.assertRaises(ValueError):
						Card.from_notation('Ace')

		def test_from_notation_invalid_rank(self):
				"""Invalid rank in notation should raise ValueError."""
				with self.assertRaises(ValueError):
						Card.from_notation('Xs')

		def test_from_notation_invalid_suit(self):
				"""Invalid suit in notation should raise ValueError."""
				with self.assertRaises(ValueError):
						Card.from_notation('Ax')

		def test_card_equality(self):
				"""Cards with same rank and suit should be equal."""
				c1 = Card(Rank.ACE, Suit.SPADES)
				c2 = Card.from_notation('As')
				self.assertEqual(c1, c2)

		def test_card_hash(self):
				"""Cards should be hashable for use in sets."""
				c1 = Card(Rank.ACE, Suit.SPADES)
				c2 = Card.from_notation('As')
				card_set = {c1, c2}
				self.assertEqual(len(card_set), 1)

		def test_card_str(self):
				"""String representation should be notation."""
				card = Card(Rank.KING, Suit.DIAMONDS)
				self.assertEqual(str(card), 'Kd')


class TestCardsFromString(unittest.TestCase):
		"""Tests for cards_from_string helper."""

		def test_parse_multiple_cards(self):
				"""Should parse multiple cards from string."""
				cards = cards_from_string('As Kh Qd')
				self.assertEqual(len(cards), 3)
				self.assertEqual(cards[0].notation, 'As')
				self.assertEqual(cards[1].notation, 'Kh')
				self.assertEqual(cards[2].notation, 'Qd')

		def test_parse_single_card(self):
				"""Should parse single card."""
				cards = cards_from_string('As')
				self.assertEqual(len(cards), 1)
				self.assertEqual(cards[0].notation, 'As')

		def test_parse_with_extra_whitespace(self):
				"""Should handle extra whitespace."""
				cards = cards_from_string('  As   Kh  ')
				self.assertEqual(len(cards), 2)


if __name__ == '__main__':
		unittest.main()

