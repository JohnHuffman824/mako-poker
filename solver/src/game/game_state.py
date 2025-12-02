"""
Game state representation for Heads-Up No-Limit Texas Hold'em.
"""

from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
import copy

from .card import Card
from .deck import Deck
from .action import Action, ActionType
from .hand_evaluator import HandEvaluator


class Street(Enum):
    """Betting rounds in Texas Hold'em."""
    PREFLOP = 0
    FLOP = 1
    TURN = 2
    RIVER = 3

    def next(self) -> Optional['Street']:
        """Returns the next street, or None if already at river."""
        if self == Street.RIVER:
            return None
        return Street(self.value + 1)


@dataclass
class GameState:
    """
    Represents the complete state of a heads-up poker hand.

    Designed for CFR traversal with immutable-style updates.
    """
    # Player hole cards: [player0_cards, player1_cards]
    hole_cards: tuple[list[Card], list[Card]]

    # Community cards (0-5 cards depending on street)
    community_cards: list[Card]

    # Current pot size
    pot: int

    # Player stacks: [player0_stack, player1_stack]
    stacks: list[int]

    # Current player to act (0 or 1)
    current_player: int

    # Current betting street
    street: Street

    # History of actions taken this hand
    action_history: list[Action] = field(default_factory=list)

    # Amount each player has bet in current betting round
    bets_this_round: list[int] = field(default_factory=lambda: [0, 0])

    # Whether the hand has ended
    is_terminal: bool = False

    # Winner if hand is over (-1 = not over, 0 = player0, 1 = player1, 2 = tie)
    winner: int = -1

    # Big blind size for min-raise calculations
    big_blind: int = 2

    # Whether this round has seen a bet/raise
    facing_bet: bool = False

    @classmethod
    def new_hand(
        cls,
        hole_cards: tuple[list[Card], list[Card]],
        stacks: Optional[list[int]] = None,
        big_blind: int = 2
    ) -> 'GameState':
        """
        Creates a new hand at the start of preflop betting.

        Args:
            hole_cards: Tuple of hole cards for each player
            stacks: Starting stacks (default 100bb each)
            big_blind: Big blind size (default 2)

        Returns:
            New GameState at start of preflop
        """
        if stacks is None:
            stacks = [100 * big_blind, 100 * big_blind]

        small_blind = big_blind // 2

        # Post blinds: player 0 is SB, player 1 is BB
        return cls(
            hole_cards=hole_cards,
            community_cards=[],
            pot=small_blind + big_blind,
            stacks=[stacks[0] - small_blind, stacks[1] - big_blind],
            current_player=0,  # SB acts first preflop
            street=Street.PREFLOP,
            action_history=[],
            bets_this_round=[small_blind, big_blind],
            is_terminal=False,
            winner=-1,
            big_blind=big_blind,
            facing_bet=True  # SB is facing BB's forced bet
        )

    def get_legal_actions(self) -> list[Action]:
        """
        Returns all legal actions for the current player.
        """
        if self.is_terminal:
            return []

        actions = []
        player = self.current_player
        my_stack = self.stacks[player]
        my_bet = self.bets_this_round[player]
        opp_bet = self.bets_this_round[1 - player]
        to_call = opp_bet - my_bet

        # Fold is always legal if facing a bet
        if to_call > 0:
            actions.append(Action.fold())

        # Check is legal if not facing a bet
        if to_call == 0:
            actions.append(Action.check())

        # Call is legal if facing a bet and have chips
        if to_call > 0 and my_stack > 0:
            call_amount = min(to_call, my_stack)
            if call_amount < my_stack:
                actions.append(Action.call())
            else:
                # Calling puts us all-in
                actions.append(Action.all_in(call_amount))

        # Bet/Raise if we have enough chips
        min_raise = self._get_min_raise()
        if my_stack > to_call:
            if to_call == 0:
                # Bet (no current bet to raise)
                if my_stack >= min_raise:
                    actions.append(Action.bet(min_raise))
                # Can always go all-in
                if my_stack > min_raise:
                    actions.append(Action.all_in(my_stack))
            else:
                # Raise (there's a bet to raise)
                raise_total = opp_bet + min_raise
                if my_stack >= raise_total - my_bet:
                    actions.append(Action.raise_to(raise_total))
                # Can always go all-in if we have more than call amount
                if my_stack > to_call:
                    actions.append(Action.all_in(my_stack))

        return actions

    def _get_min_raise(self) -> int:
        """Returns minimum raise/bet size."""
        # In NLHE, min raise is the size of the last raise or big blind
        return self.big_blind

    def apply_action(self, action: Action) -> 'GameState':
        """
        Apply an action and return the new game state.

        Returns a new GameState object (doesn't mutate self).
        """
        # Create a copy of the current state
        new_state = copy.deepcopy(self)
        new_state.action_history = self.action_history + [action]

        player = self.current_player
        opponent = 1 - player
        my_bet = self.bets_this_round[player]
        opp_bet = self.bets_this_round[opponent]
        to_call = opp_bet - my_bet

        if action.type == ActionType.FOLD:
            new_state.is_terminal = True
            new_state.winner = opponent
            return new_state

        elif action.type == ActionType.CHECK:
            # Check if round is complete
            if self._is_round_complete_after_check():
                new_state._advance_street()
            else:
                new_state.current_player = opponent

        elif action.type == ActionType.CALL:
            call_amount = min(to_call, self.stacks[player])
            new_state.stacks[player] -= call_amount
            new_state.pot += call_amount
            new_state.bets_this_round[player] += call_amount

            # After a call, round is complete
            new_state._advance_street()

        elif action.type in (ActionType.BET, ActionType.RAISE):
            # Calculate amount going into pot
            if action.type == ActionType.BET:
                amount_to_pot = action.amount
            else:
                # Raise to X means total bet is X
                amount_to_pot = action.amount - my_bet

            new_state.stacks[player] -= amount_to_pot
            new_state.pot += amount_to_pot
            new_state.bets_this_round[player] += amount_to_pot
            new_state.current_player = opponent
            new_state.facing_bet = True

        elif action.type == ActionType.ALL_IN:
            amount = action.amount
            new_state.stacks[player] -= amount
            new_state.pot += amount
            new_state.bets_this_round[player] += amount

            # Check if opponent needs to act
            if new_state.bets_this_round[player] > opp_bet:
                new_state.current_player = opponent
                new_state.facing_bet = True
            else:
                # All-in for less than call amount, round complete
                new_state._advance_street()

        return new_state

    def _is_round_complete_after_check(self) -> bool:
        """Check if betting round completes after a check."""
        # Preflop: BB can check after SB calls
        if self.street == Street.PREFLOP:
            # SB limped (called BB), now BB checks
            return self.current_player == 1 and not self.facing_bet

        # Postflop: second check ends the round
        return self.current_player == 1

    def _advance_street(self) -> None:
        """Advance to the next street or showdown."""
        # Reset betting round state
        self.bets_this_round = [0, 0]
        self.facing_bet = False
        self.current_player = 1  # BB acts first postflop

        # Check if both players are all-in
        if self.stacks[0] == 0 or self.stacks[1] == 0:
            self._run_out_board()
            return

        next_street = self.street.next()
        if next_street is None:
            # River complete, go to showdown
            self._showdown()
        else:
            self.street = next_street

    def _run_out_board(self) -> None:
        """Run out remaining community cards and go to showdown."""
        from .deck import Deck

        # Deal remaining community cards
        cards_needed = 5 - len(self.community_cards)
        if cards_needed > 0:
            # Create deck excluding known cards
            excluded = list(self.hole_cards[0]) + list(self.hole_cards[1])
            excluded += self.community_cards
            deck = Deck(exclude=excluded).shuffle()
            self.community_cards = self.community_cards + deck.deal(cards_needed)

        self._showdown()

    def _showdown(self) -> None:
        """Determine winner at showdown."""
        self.is_terminal = True

        hand0 = HandEvaluator.evaluate(
            self.hole_cards[0], self.community_cards
        )
        hand1 = HandEvaluator.evaluate(
            self.hole_cards[1], self.community_cards
        )

        if hand0.absolute_rank > hand1.absolute_rank:
            self.winner = 0
        elif hand1.absolute_rank > hand0.absolute_rank:
            self.winner = 1
        else:
            self.winner = 2  # Tie

    def get_payoff(self, player: int) -> float:
        """
        Returns payoff for specified player.

        Returns 0 if hand is not terminal.
        Payoff is the change in stack from start of hand.
        """
        if not self.is_terminal:
            return 0.0

        if self.winner == 2:  # Tie
            # Each player gets back their contribution
            return 0.0
        elif self.winner == player:
            # Winner gets the pot minus their contribution
            return self.pot / 2
        else:
            # Loser loses their contribution
            return -self.pot / 2

    def encode_history(self) -> str:
        """Encode action history to string for information set key."""
        return '|'.join(a.encode() for a in self.action_history)

    def __str__(self) -> str:
        return (
            f'GameState(street={self.street.name}, '
            f'pot={self.pot}, '
            f'stacks={self.stacks}, '
            f'player={self.current_player}, '
            f'terminal={self.is_terminal})'
        )

