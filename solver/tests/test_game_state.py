"""
Tests for game state module.
"""

import unittest
import sys
from pathlib import Path

# Add solver root to path so 'src' is a package
sys.path.insert(0, str(Path(__file__).parent.parent))

from src.game.card import cards_from_string
from src.game.action import Action, ActionType
from src.game.game_state import GameState, Street


class TestGameStateCreation(unittest.TestCase):
    """Tests for GameState creation."""

    def test_new_hand(self):
        """Should create new hand at preflop."""
        hole_cards = (
            cards_from_string('As Ks'),
            cards_from_string('Qh Jh')
        )
        state = GameState.new_hand(hole_cards)

        self.assertEqual(state.street, Street.PREFLOP)
        self.assertEqual(len(state.community_cards), 0)
        self.assertFalse(state.is_terminal)
        # Pot should have blinds (SB=1 + BB=2 = 3 with default BB=2)
        self.assertEqual(state.pot, 3)

    def test_new_hand_with_stacks(self):
        """Should respect custom stack sizes."""
        hole_cards = (
            cards_from_string('As Ks'),
            cards_from_string('Qh Jh')
        )
        state = GameState.new_hand(hole_cards, stacks=[500, 500])

        # After posting blinds
        self.assertEqual(state.stacks[0], 499)  # SB posted
        self.assertEqual(state.stacks[1], 498)  # BB posted


class TestLegalActions(unittest.TestCase):
    """Tests for legal action determination."""

    def test_preflop_sb_actions(self):
        """SB should be able to fold, call, or raise preflop."""
        hole_cards = (
            cards_from_string('As Ks'),
            cards_from_string('Qh Jh')
        )
        state = GameState.new_hand(hole_cards)

        actions = state.get_legal_actions()
        action_types = [a.type for a in actions]

        self.assertIn(ActionType.FOLD, action_types)
        self.assertIn(ActionType.CALL, action_types)
        # Should have at least one raise option
        self.assertTrue(
            any(t in action_types for t in [ActionType.RAISE, ActionType.ALL_IN])
        )

    def test_terminal_has_no_actions(self):
        """Terminal state should have no legal actions."""
        hole_cards = (
            cards_from_string('As Ks'),
            cards_from_string('Qh Jh')
        )
        state = GameState.new_hand(hole_cards)

        # Fold
        state = state.apply_action(Action.fold())
        actions = state.get_legal_actions()

        self.assertEqual(len(actions), 0)


class TestActionApplication(unittest.TestCase):
    """Tests for applying actions."""

    def test_fold_ends_hand(self):
        """Fold should make state terminal."""
        hole_cards = (
            cards_from_string('As Ks'),
            cards_from_string('Qh Jh')
        )
        state = GameState.new_hand(hole_cards)

        state = state.apply_action(Action.fold())

        self.assertTrue(state.is_terminal)
        self.assertEqual(state.winner, 1)  # Opponent wins

    def test_call_and_check(self):
        """Preflop: SB call then BB check should go to flop."""
        hole_cards = (
            cards_from_string('As Ks'),
            cards_from_string('Qh Jh')
        )
        state = GameState.new_hand(hole_cards)

        # SB calls
        state = state.apply_action(Action.call())

        # BB's turn, can check
        actions = state.get_legal_actions()
        action_types = [a.type for a in actions]
        self.assertIn(ActionType.CHECK, action_types)

    def test_bet_updates_pot(self):
        """Bet should increase pot size."""
        hole_cards = (
            cards_from_string('As Ks'),
            cards_from_string('Qh Jh')
        )
        state = GameState.new_hand(hole_cards)
        initial_pot = state.pot

        # SB calls (adds 1 chip to match BB)
        state = state.apply_action(Action.call())

        self.assertGreater(state.pot, initial_pot)

    def test_action_history_tracked(self):
        """Actions should be added to history."""
        hole_cards = (
            cards_from_string('As Ks'),
            cards_from_string('Qh Jh')
        )
        state = GameState.new_hand(hole_cards)

        self.assertEqual(len(state.action_history), 0)

        state = state.apply_action(Action.call())
        self.assertEqual(len(state.action_history), 1)

        state = state.apply_action(Action.check())
        self.assertEqual(len(state.action_history), 2)


class TestPayoffs(unittest.TestCase):
    """Tests for payoff calculation."""

    def test_fold_payoff(self):
        """Folder should lose, opponent should win."""
        hole_cards = (
            cards_from_string('As Ks'),
            cards_from_string('Qh Jh')
        )
        state = GameState.new_hand(hole_cards)

        # SB folds
        state = state.apply_action(Action.fold())

        # Player 1 (BB) wins
        p0_payoff = state.get_payoff(0)
        p1_payoff = state.get_payoff(1)

        self.assertLess(p0_payoff, 0)  # Folder loses
        self.assertGreater(p1_payoff, 0)  # Winner gains


class TestStreet(unittest.TestCase):
    """Tests for Street enum."""

    def test_street_ordering(self):
        """Streets should be ordered correctly."""
        self.assertLess(Street.PREFLOP.value, Street.FLOP.value)
        self.assertLess(Street.FLOP.value, Street.TURN.value)
        self.assertLess(Street.TURN.value, Street.RIVER.value)

    def test_next_street(self):
        """next() should return next street."""
        self.assertEqual(Street.PREFLOP.next(), Street.FLOP)
        self.assertEqual(Street.FLOP.next(), Street.TURN)
        self.assertEqual(Street.TURN.next(), Street.RIVER)
        self.assertIsNone(Street.RIVER.next())


class TestEncodeHistory(unittest.TestCase):
    """Tests for action history encoding."""

    def test_encode_empty_history(self):
        """Empty history should encode to empty string."""
        hole_cards = (
            cards_from_string('As Ks'),
            cards_from_string('Qh Jh')
        )
        state = GameState.new_hand(hole_cards)

        self.assertEqual(state.encode_history(), '')

    def test_encode_with_actions(self):
        """History should encode actions."""
        hole_cards = (
            cards_from_string('As Ks'),
            cards_from_string('Qh Jh')
        )
        state = GameState.new_hand(hole_cards)

        state = state.apply_action(Action.call())
        history = state.encode_history()

        self.assertIn('c', history)


if __name__ == '__main__':
    unittest.main()

