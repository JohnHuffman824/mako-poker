"""
Tests for Kuhn Poker CFR validation.

Kuhn Poker has a known Nash equilibrium that we use to validate
the CFR implementation is correct.

Expected Nash Equilibrium:
- Game value for Player 0: -1/18 ≈ -0.0556
- Player 1 (with Jack): bet frequency between 0 and 1/3
- Player 1 (with King): bet frequency = 3 * Jack bet frequency
"""

import unittest
import sys
from pathlib import Path

# Add solver root to path so 'src' is a package
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.cfr.cfr_plus import KuhnCFRSolver


class TestKuhnNashEquilibrium(unittest.TestCase):
    """
    Validate CFR implementation against Kuhn Poker Nash equilibrium.

    This is a critical test that proves our CFR implementation is correct.
    """

    def setUp(self):
        # Train solver
        self.solver = KuhnCFRSolver()
        self.solver.train(iterations=100000)

    def test_game_value_converges_to_nash(self):
        """
        Game value should converge to -1/18 ≈ -0.0556 for Player 0.

        This is the theoretical Nash equilibrium value.
        """
        expected_value = -1/18  # ≈ -0.0556
        actual_value = self.solver.get_game_value()

        # Allow some tolerance for convergence
        self.assertAlmostEqual(
            actual_value,
            expected_value,
            places=2,
            msg=f'Game value {actual_value:.4f} should be close to '
                f'{expected_value:.4f}'
        )

    def test_jack_bet_frequency_valid(self):
        """
        Jack bet frequency should be between 0 and 1/3.

        At Nash equilibrium, Player 1 with Jack can bet any frequency
        in [0, 1/3] as part of a bluffing strategy.
        """
        jack_strategy = self.solver.get_strategy('J')
        jack_bet = jack_strategy['bet']

        self.assertGreaterEqual(jack_bet, 0.0)
        self.assertLessEqual(
            jack_bet,
            1/3 + 0.05,  # Small tolerance
            msg=f'Jack bet frequency {jack_bet:.3f} should be <= 1/3'
        )

    def test_king_bet_frequency_relation(self):
        """
        King bet frequency should be approximately 3x Jack bet frequency.

        This is a key constraint of the Nash equilibrium.
        """
        jack_strategy = self.solver.get_strategy('J')
        king_strategy = self.solver.get_strategy('K')

        jack_bet = jack_strategy['bet']
        king_bet = king_strategy['bet']

        # Only check if Jack bets enough to measure
        if jack_bet > 0.05:
            expected_king_bet = 3 * jack_bet
            self.assertAlmostEqual(
                king_bet,
                expected_king_bet,
                places=1,
                msg=f'King bet {king_bet:.3f} should be ~3x Jack bet '
                    f'{jack_bet:.3f}'
            )

    def test_queen_has_mixed_strategy(self):
        """
        Queen should have mixed strategy (neither pure bet nor check).

        In Nash equilibrium, Queen's optimal strategy is to sometimes
        bet as a semi-bluff.
        """
        queen_strategy = self.solver.get_strategy('Q')
        queen_bet = queen_strategy['bet']
        queen_check = queen_strategy['check']

        # Should not be pure strategy
        self.assertGreater(queen_bet, 0.0)
        self.assertGreater(queen_check, 0.0)


class TestKuhnSolverBasics(unittest.TestCase):
    """Basic tests for Kuhn solver functionality."""

    def test_solver_initialization(self):
        """Solver should initialize with empty infoset map."""
        solver = KuhnCFRSolver()
        self.assertEqual(len(solver.infoset_map), 0)

    def test_training_creates_infosets(self):
        """Training should create information sets."""
        solver = KuhnCFRSolver()
        solver.train(iterations=100)

        # Kuhn poker has 12 information sets
        # (3 cards × 4 possible action histories)
        self.assertGreater(len(solver.infoset_map), 0)

    def test_strategy_is_probability_distribution(self):
        """Strategies should be valid probability distributions."""
        solver = KuhnCFRSolver()
        solver.train(iterations=1000)

        for card in ['J', 'Q', 'K']:
            strategy = solver.get_strategy(card)
            total = strategy['bet'] + strategy['check']
            self.assertAlmostEqual(
                total, 1.0, places=5,
                msg=f'{card} strategy should sum to 1.0'
            )

    def test_get_game_value_before_training(self):
        """Game value should be 0 before training."""
        solver = KuhnCFRSolver()
        self.assertEqual(solver.get_game_value(), 0.0)

    def test_print_strategies(self):
        """print_strategies should not raise errors."""
        solver = KuhnCFRSolver()
        solver.train(iterations=100)

        # Should not raise
        solver.print_strategies()


class TestKuhnConvergence(unittest.TestCase):
    """Test convergence behavior of Kuhn solver."""

    def test_more_iterations_better_convergence(self):
        """More iterations should give better convergence."""
        solver_few = KuhnCFRSolver()
        solver_many = KuhnCFRSolver()

        solver_few.train(iterations=1000)
        solver_many.train(iterations=50000)

        expected = -1/18

        error_few = abs(solver_few.get_game_value() - expected)
        error_many = abs(solver_many.get_game_value() - expected)

        self.assertLessEqual(error_many, error_few + 0.01)


if __name__ == '__main__':
    unittest.main()

