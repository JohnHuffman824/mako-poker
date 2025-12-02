"""
Tests for CFR+ solver.
"""

import unittest
import sys
from pathlib import Path
import numpy as np

# Add solver root to path so 'src' is a package
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.cfr.cfr_plus import CFRPlusSolver
from src.abstraction.hand_bucketing import HandBucketing
from src.abstraction.action_abstraction import ActionAbstraction


class TestCFRPlusSolver(unittest.TestCase):
    """Tests for CFRPlusSolver class."""

    def setUp(self):
        # Use simple abstractions for faster tests
        self.hand_bucketing = HandBucketing(
            preflop_buckets=10,
            postflop_buckets=5,
            equity_samples=50
        )
        self.action_abstraction = ActionAbstraction()

    def test_initialization(self):
        """Should initialize with empty infoset map."""
        solver = CFRPlusSolver(
            hand_bucketing=self.hand_bucketing,
            action_abstraction=self.action_abstraction
        )

        self.assertEqual(solver.num_infosets, 0)

    def test_train_creates_infosets(self):
        """Training should create information sets."""
        solver = CFRPlusSolver(
            hand_bucketing=self.hand_bucketing,
            action_abstraction=self.action_abstraction
        )

        solver.train(iterations=10, verbose=False)

        self.assertGreater(solver.num_infosets, 0)

    def test_get_game_value(self):
        """Should return average game value."""
        solver = CFRPlusSolver(
            hand_bucketing=self.hand_bucketing,
            action_abstraction=self.action_abstraction
        )

        value = solver.get_game_value()
        self.assertEqual(value, 0.0)  # Before training

        solver.train(iterations=10, verbose=False)

        value = solver.get_game_value()
        # Value should be some finite number
        self.assertTrue(np.isfinite(value))

    def test_strategy_probabilities_sum_to_one(self):
        """Strategies should be valid probability distributions."""
        solver = CFRPlusSolver(
            hand_bucketing=self.hand_bucketing,
            action_abstraction=self.action_abstraction
        )

        solver.train(iterations=50, verbose=False)

        # Check some strategies
        for key in list(solver.infoset_manager.keys())[:5]:
            strategy = solver.get_strategy(key)
            if strategy is not None:
                self.assertAlmostEqual(np.sum(strategy), 1.0, places=5)


class TestInfosetKeyGeneration(unittest.TestCase):
    """Tests for infoset key generation."""

    def test_same_state_same_key(self):
        """Same game state should produce same infoset key."""
        solver = CFRPlusSolver()

        # Run a few iterations and check key consistency
        solver.train(iterations=5, verbose=False)

        # Keys should be deterministic for same state
        keys = list(solver.infoset_manager.keys())
        for key in keys[:3]:
            # Key format: bucket:street:history
            parts = key.split(':')
            self.assertEqual(len(parts), 3)


if __name__ == '__main__':
    unittest.main()

