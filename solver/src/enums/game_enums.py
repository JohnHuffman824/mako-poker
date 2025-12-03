"""
Game-related enums: Street, Position, ActionType.

These match the Kotlin definitions in Scenario.kt and Recommendation.kt
for cross-language consistency.
"""

from enum import Enum


class StreetEnum(str, Enum):
    """
    Betting streets in Texas Hold'em.

    Each street represents a distinct phase of betting.
    """
    PREFLOP = 'PREFLOP'
    FLOP = 'FLOP'
    TURN = 'TURN'
    RIVER = 'RIVER'

    @property
    def community_card_count(self) -> int:
        """Number of community cards dealt by this street."""
        counts = {
            'PREFLOP': 0,
            'FLOP': 3,
            'TURN': 4,
            'RIVER': 5
        }
        return counts[self.value]

    def next_street(self) -> 'StreetEnum | None':
        """Returns the next street, or None if at river."""
        order = [self.PREFLOP, self.FLOP, self.TURN, self.RIVER]
        idx = order.index(self)
        return order[idx + 1] if idx < 3 else None


class PositionEnum(str, Enum):
    """
    Player positions at the poker table.

    Positions are listed in order of action postflop (early to late).
    Values match Kotlin Position enum for cross-language consistency.
    """
    # Early positions
    UTG = 'UTG'       # Under the gun (first to act preflop after blinds)
    UTG_1 = 'UTG_1'   # UTG+1

    # Middle positions
    MP = 'MP'         # Middle position
    MP_1 = 'MP_1'     # Middle position+1
    HJ = 'HJ'         # Hijack (2 before button)

    # Late positions
    CO = 'CO'         # Cutoff (1 before button)
    BTN = 'BTN'       # Button (dealer, best position)

    # Blinds
    SB = 'SB'         # Small blind
    BB = 'BB'         # Big blind

    @property
    def is_blind(self) -> bool:
        """Returns True if this is a blind position."""
        return self in (self.SB, self.BB)

    @property
    def is_late(self) -> bool:
        """Returns True if this is a late position (CO, BTN)."""
        return self in (self.CO, self.BTN)

    @property
    def is_early(self) -> bool:
        """Returns True if this is an early position (UTG, UTG_1)."""
        return self in (self.UTG, self.UTG_1)


class ActionTypeEnum(str, Enum):
    """
    Poker action types.

    Represents the possible actions a player can take on their turn.
    """
    FOLD = 'fold'
    CHECK = 'check'
    CALL = 'call'
    BET = 'bet'
    RAISE = 'raise'
    ALL_IN = 'all_in'

    @property
    def is_aggressive(self) -> bool:
        """Returns True if this is an aggressive action (bet/raise/all-in)."""
        return self in (self.BET, self.RAISE, self.ALL_IN)

    @property
    def is_passive(self) -> bool:
        """Returns True if this is a passive action (check/call)."""
        return self in (self.CHECK, self.CALL)

    @property
    def requires_amount(self) -> bool:
        """Returns True if this action requires a bet amount."""
        return self in (self.BET, self.RAISE, self.ALL_IN)

