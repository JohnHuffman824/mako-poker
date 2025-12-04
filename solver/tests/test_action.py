"""
Tests for action module.
"""

import unittest
import sys
from pathlib import Path

# Add solver root to path so 'src' is a package
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.game.action import Action, ActionType


class TestAction(unittest.TestCase):
	"""Tests for Action class."""

	def test_fold_action(self):
		"""Should create fold action."""
		action = Action.fold()
		self.assertEqual(action.type, ActionType.FOLD)
		self.assertEqual(action.amount, 0)

	def test_check_action(self):
		"""Should create check action."""
		action = Action.check()
		self.assertEqual(action.type, ActionType.CHECK)
		self.assertEqual(action.amount, 0)

	def test_call_action(self):
		"""Should create call action."""
		action = Action.call()
		self.assertEqual(action.type, ActionType.CALL)
		self.assertEqual(action.amount, 0)

	def test_bet_action(self):
		"""Should create bet action with amount."""
		action = Action.bet(100)
		self.assertEqual(action.type, ActionType.BET)
		self.assertEqual(action.amount, 100)

	def test_raise_action(self):
		"""Should create raise action with amount."""
		action = Action.raise_to(200)
		self.assertEqual(action.type, ActionType.RAISE)
		self.assertEqual(action.amount, 200)

	def test_all_in_action(self):
		"""Should create all-in action with amount."""
		action = Action.all_in(500)
		self.assertEqual(action.type, ActionType.ALL_IN)
		self.assertEqual(action.amount, 500)

	def test_is_aggressive(self):
		"""Bet/raise/all-in should be aggressive."""
		self.assertTrue(Action.bet(100).is_aggressive())
		self.assertTrue(Action.raise_to(200).is_aggressive())
		self.assertTrue(Action.all_in(500).is_aggressive())
		self.assertFalse(Action.check().is_aggressive())
		self.assertFalse(Action.call().is_aggressive())
		self.assertFalse(Action.fold().is_aggressive())

	def test_is_passive(self):
		"""Check/call should be passive."""
		self.assertTrue(Action.check().is_passive())
		self.assertTrue(Action.call().is_passive())
		self.assertFalse(Action.bet(100).is_passive())
		self.assertFalse(Action.fold().is_passive())

	def test_encode(self):
		"""Actions should encode to short strings."""
		self.assertEqual(Action.fold().encode(), 'f')
		self.assertEqual(Action.check().encode(), 'x')
		self.assertEqual(Action.call().encode(), 'c')
		self.assertEqual(Action.bet(100).encode(), 'b100')
		self.assertEqual(Action.raise_to(200).encode(), 'r200')
		self.assertEqual(Action.all_in(500).encode(), 'a')

	def test_action_str(self):
		"""String representation should be readable."""
		self.assertEqual(str(Action.fold()), 'fold')
		self.assertEqual(str(Action.check()), 'check')
		self.assertEqual(str(Action.bet(100)), 'bet(100)')

	def test_action_equality(self):
		"""Actions with same type and amount should be equal."""
		a1 = Action.bet(100)
		a2 = Action.bet(100)
		a3 = Action.bet(200)
		self.assertEqual(a1, a2)
		self.assertNotEqual(a1, a3)

	def test_action_hashable(self):
		"""Actions should be hashable for use in sets."""
		actions = {Action.fold(), Action.fold(), Action.check()}
		self.assertEqual(len(actions), 2)


if __name__ == '__main__':
	unittest.main()

