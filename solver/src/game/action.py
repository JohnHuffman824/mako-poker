"""
Poker actions for game state representation.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional


class ActionType(Enum):
	"""Types of actions a player can take."""
	FOLD = 'fold'
	CHECK = 'check'
	CALL = 'call'
	BET = 'bet'
	RAISE = 'raise'
	ALL_IN = 'all_in'


@dataclass(frozen=True)
class Action:
	"""
	Represents a player action in poker.

	Attributes:
		type: The type of action (fold, check, call, bet, raise, all_in)
		amount: The bet/raise amount (0 for fold/check/call)
	"""
	type: ActionType
	amount: int = 0

	def __str__(self) -> str:
		if self.type in (ActionType.BET, ActionType.RAISE, ActionType.ALL_IN):
			return f'{self.type.value}({self.amount})'
		return self.type.value

	def __repr__(self) -> str:
		return f'Action({self.type.value}, {self.amount})'

	@classmethod
	def fold(cls) -> 'Action':
		"""Create a fold action."""
		return cls(ActionType.FOLD)

	@classmethod
	def check(cls) -> 'Action':
		"""Create a check action."""
		return cls(ActionType.CHECK)

	@classmethod
	def call(cls) -> 'Action':
		"""Create a call action."""
		return cls(ActionType.CALL)

	@classmethod
	def bet(cls, amount: int) -> 'Action':
		"""Create a bet action with specified amount."""
		return cls(ActionType.BET, amount)

	@classmethod
	def raise_to(cls, amount: int) -> 'Action':
		"""Create a raise action with specified total amount."""
		return cls(ActionType.RAISE, amount)

	@classmethod
	def all_in(cls, amount: int) -> 'Action':
		"""Create an all-in action with specified amount."""
		return cls(ActionType.ALL_IN, amount)

	def is_aggressive(self) -> bool:
		"""Returns True if this is a bet, raise, or all-in."""
		return self.type in (ActionType.BET, ActionType.RAISE, ActionType.ALL_IN)

	def is_passive(self) -> bool:
		"""Returns True if this is a check or call."""
		return self.type in (ActionType.CHECK, ActionType.CALL)

	def encode(self) -> str:
		"""
		Encode action to a short string for history representation.
		Used in information set keys.
		"""
		if self.type == ActionType.FOLD:
			return 'f'
		elif self.type == ActionType.CHECK:
			return 'x'
		elif self.type == ActionType.CALL:
			return 'c'
		elif self.type == ActionType.BET:
			return f'b{self.amount}'
		elif self.type == ActionType.RAISE:
			return f'r{self.amount}'
		elif self.type == ActionType.ALL_IN:
			return 'a'
		return '?'

