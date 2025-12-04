"""
Tests for information set module.
"""

import unittest
import sys
from pathlib import Path
import numpy as np

# Add solver root to path so 'src' is a package
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.cfr.information_set import InformationSet, InformationSetManager


class TestInformationSet(unittest.TestCase):
	"""Tests for InformationSet class."""

	def test_initial_strategy_uniform(self):
		"""Initial strategy should be uniform."""
		infoset = InformationSet(num_actions=3)
		strategy = infoset.get_strategy()

		expected = np.array([1/3, 1/3, 1/3])
		np.testing.assert_array_almost_equal(strategy, expected)

	def test_strategy_sums_to_one(self):
		"""Strategy should always sum to 1."""
		infoset = InformationSet(num_actions=5)

		for _ in range(10):
			strategy = infoset.get_strategy()
			self.assertAlmostEqual(np.sum(strategy), 1.0)

	def test_positive_regrets_affect_strategy(self):
		"""Positive regrets should increase action probability."""
		infoset = InformationSet(num_actions=3)

		# Set regrets to favor action 0
		infoset.cumulative_regrets = np.array([10.0, 0.0, 0.0])
		strategy = infoset.get_strategy()

		# Action 0 should have all probability
		self.assertAlmostEqual(strategy[0], 1.0)
		self.assertAlmostEqual(strategy[1], 0.0)
		self.assertAlmostEqual(strategy[2], 0.0)

	def test_cfr_plus_clamps_negatives(self):
		"""CFR+ should clamp negative regrets to zero."""
		infoset = InformationSet(num_actions=3)
		infoset.cumulative_regrets = np.array([-5.0, 10.0, 5.0])

		strategy = infoset.get_strategy()

		# Negative regret action should have 0 probability
		self.assertAlmostEqual(strategy[0], 0.0)
		self.assertGreater(strategy[1], strategy[2])

	def test_average_strategy_converges(self):
		"""Average strategy should reflect accumulated strategies."""
		infoset = InformationSet(num_actions=2)

		# Simulate getting strategy multiple times
		for _ in range(100):
			infoset.cumulative_regrets = np.array([1.0, 0.0])
			infoset.get_strategy(reach_probability=1.0)

		avg = infoset.get_average_strategy()

		# Should strongly favor action 0
		self.assertGreater(avg[0], 0.9)

	def test_update_regrets(self):
		"""Should update regrets based on action utilities."""
		infoset = InformationSet(num_actions=2)

		# Action 0 is better
		action_utilities = np.array([5.0, 3.0])
		infoset.update_regrets(action_utilities, counterfactual_reach=1.0)

		# Action 0 should have positive regret
		self.assertGreater(
			infoset.cumulative_regrets[0],
			infoset.cumulative_regrets[1]
		)


class TestInformationSetManager(unittest.TestCase):
	"""Tests for InformationSetManager class."""

	def test_get_or_create(self):
		"""Should create new infoset if not exists."""
		manager = InformationSetManager()

		infoset = manager.get_or_create('key1', num_actions=3)
		self.assertIsNotNone(infoset)
		self.assertEqual(infoset.num_actions, 3)

	def test_get_or_create_returns_existing(self):
		"""Should return existing infoset."""
		manager = InformationSetManager()

		infoset1 = manager.get_or_create('key1', num_actions=3)
		infoset1.cumulative_regrets[0] = 5.0

		infoset2 = manager.get_or_create('key1', num_actions=3)

		self.assertIs(infoset1, infoset2)
		self.assertEqual(infoset2.cumulative_regrets[0], 5.0)

	def test_get_returns_none_if_missing(self):
		"""get() should return None for missing key."""
		manager = InformationSetManager()

		result = manager.get('nonexistent')
		self.assertIsNone(result)

	def test_len(self):
		"""len() should return number of infosets."""
		manager = InformationSetManager()

		self.assertEqual(len(manager), 0)

		manager.get_or_create('key1', 3)
		manager.get_or_create('key2', 3)

		self.assertEqual(len(manager), 2)

	def test_contains(self):
		"""Should support 'in' operator."""
		manager = InformationSetManager()
		manager.get_or_create('key1', 3)

		self.assertIn('key1', manager)
		self.assertNotIn('key2', manager)

	def test_iteration(self):
		"""Should support iteration."""
		manager = InformationSetManager()
		manager.get_or_create('key1', 3)
		manager.get_or_create('key2', 3)

		keys = [k for k, v in manager]
		self.assertEqual(set(keys), {'key1', 'key2'})

	def test_get_strategy(self):
		"""Should get strategy by key."""
		manager = InformationSetManager()
		infoset = manager.get_or_create('key1', 2)
		infoset.cumulative_regrets = np.array([1.0, 0.0])
		infoset.get_strategy()  # Update strategy sum

		strategy = manager.get_strategy('key1')
		self.assertIsNotNone(strategy)

	def test_total_regret(self):
		"""Should compute total regret across all infosets."""
		manager = InformationSetManager()

		infoset1 = manager.get_or_create('key1', 2)
		infoset1.cumulative_regrets = np.array([5.0, 0.0])

		infoset2 = manager.get_or_create('key2', 2)
		infoset2.cumulative_regrets = np.array([3.0, 2.0])

		total = manager.total_regret()
		self.assertEqual(total, 10.0)


if __name__ == '__main__':
	unittest.main()

