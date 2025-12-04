"""
Tests for action abstraction.
"""

import unittest
import sys
from pathlib import Path

# Add solver root to path so 'src' is a package
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.game.card import cards_from_string
from src.game.action import Action, ActionType
from src.game.game_state import GameState
from src.abstraction.action_abstraction import ActionAbstraction


class TestActionAbstraction(unittest.TestCase):
	"""Tests for ActionAbstraction class."""

	def setUp(self):
		self.abstraction = ActionAbstraction()

	def _create_preflop_state(self) -> GameState:
		"""Create a preflop game state."""
		hole_cards = (
			cards_from_string('As Ks'),
			cards_from_string('Qh Jh')
		)
		return GameState.new_hand(hole_cards)

	def test_fold_always_available_when_facing_bet(self):
		"""Fold should be available when facing a bet."""
		state = self._create_preflop_state()
		actions = self.abstraction.get_abstract_actions(state)
		action_types = [a.type for a in actions]

		self.assertIn(ActionType.FOLD, action_types)

	def test_check_available_when_no_bet(self):
		"""Check should be available when not facing a bet."""
		state = self._create_preflop_state()
		# SB calls
		state = state.apply_action(Action.call())

		# BB can now check
		actions = self.abstraction.get_abstract_actions(state)
		action_types = [a.type for a in actions]

		self.assertIn(ActionType.CHECK, action_types)

	def test_all_in_always_included(self):
		"""All-in should always be included as an option."""
		state = self._create_preflop_state()
		actions = self.abstraction.get_abstract_actions(state)
		action_types = [a.type for a in actions]

		self.assertIn(ActionType.ALL_IN, action_types)

	def test_no_duplicate_actions(self):
		"""Should not have duplicate actions."""
		state = self._create_preflop_state()
		actions = self.abstraction.get_abstract_actions(state)

		# Check for duplicates
		seen = set()
		for a in actions:
			key = (a.type, a.amount)
			self.assertNotIn(key, seen)
			seen.add(key)

	def test_map_to_nearest_abstract(self):
		"""Should map arbitrary bet to nearest abstract size."""
		state = self._create_preflop_state()

		# Arbitrary bet of 17
		real_action = Action.bet(17)
		mapped = self.abstraction.map_to_abstract(real_action, state)

		# Should map to some bet action
		self.assertIn(
			mapped.type,
			[ActionType.BET, ActionType.RAISE, ActionType.ALL_IN]
		)

	def test_fold_maps_to_fold(self):
		"""Fold should map to fold."""
		state = self._create_preflop_state()
		mapped = self.abstraction.map_to_abstract(Action.fold(), state)
		self.assertEqual(mapped.type, ActionType.FOLD)

	def test_check_maps_to_check(self):
		"""Check should map to check."""
		state = self._create_preflop_state()
		# Move to position where check is valid
		state = state.apply_action(Action.call())

		mapped = self.abstraction.map_to_abstract(Action.check(), state)
		self.assertEqual(mapped.type, ActionType.CHECK)


class TestActionEncoding(unittest.TestCase):
	"""Tests for action encoding."""

	def setUp(self):
		self.abstraction = ActionAbstraction()

	def test_encode_action(self):
		"""Should encode action to index."""
		hole_cards = (
			cards_from_string('As Ks'),
			cards_from_string('Qh Jh')
		)
		state = GameState.new_hand(hole_cards)

		actions = self.abstraction.get_abstract_actions(state)
		for i, action in enumerate(actions):
			idx = self.abstraction.encode_action(action, state)
			self.assertEqual(idx, i)

	def test_get_num_actions(self):
		"""Should return correct number of actions."""
		hole_cards = (
			cards_from_string('As Ks'),
			cards_from_string('Qh Jh')
		)
		state = GameState.new_hand(hole_cards)

		num = self.abstraction.get_num_actions(state)
		actions = self.abstraction.get_abstract_actions(state)

		self.assertEqual(num, len(actions))


class TestCustomAbstraction(unittest.TestCase):
	"""Tests for custom abstraction configuration."""

	def test_custom_preflop_sizes(self):
		"""Should use custom preflop raise sizes."""
		abstraction = ActionAbstraction(preflop_raise_sizes=[2.0, 4.0])

		self.assertEqual(abstraction.preflop_raise_sizes, [2.0, 4.0])

	def test_custom_postflop_sizes(self):
		"""Should use custom postflop bet sizes."""
		abstraction = ActionAbstraction(postflop_bet_sizes=[0.5, 1.0, 2.0])

		self.assertEqual(abstraction.postflop_bet_sizes, [0.5, 1.0, 2.0])


if __name__ == '__main__':
	unittest.main()

