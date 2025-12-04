"""
Action abstraction for limiting bet sizes to a tractable set.

Maps the continuous bet sizing space to a finite number of abstract actions.
"""

from typing import Optional

from ..game.action import Action, ActionType
from ..game.game_state import GameState, Street


# Default bet sizes as fractions of pot
PREFLOP_RAISE_SIZES = [2.5, 3.0]  # Multipliers of BB
POSTFLOP_BET_SIZES = [0.33, 0.67, 1.0]  # Fractions of pot


class ActionAbstraction:
	"""
	Manages action abstraction for CFR solving.

	Limits bet/raise sizes to a configurable set of pot fractions
	to keep the game tree tractable.
	"""

	def __init__(
		self,
		preflop_raise_sizes: Optional[list[float]] = None,
		postflop_bet_sizes: Optional[list[float]] = None,
		include_all_in: bool = True
	):
		"""
		Initialize action abstraction.

		Args:
			preflop_raise_sizes: Raise sizes as BB multipliers
			postflop_bet_sizes: Bet sizes as pot fractions
			include_all_in: Whether to always include all-in option
		"""
		self._preflop_sizes = (
			preflop_raise_sizes if preflop_raise_sizes is not None
			else PREFLOP_RAISE_SIZES
		)
		self._postflop_sizes = (
			postflop_bet_sizes if postflop_bet_sizes is not None
			else POSTFLOP_BET_SIZES
		)
		self._include_all_in = include_all_in

	def get_abstract_actions(self, game_state: GameState) -> list[Action]:
		"""
		Get abstracted legal actions for current game state.

		Returns a subset of legal actions with standardized bet sizes.
		"""
		if game_state.is_terminal:
			return []

		actions = []
		player = game_state.current_player
		my_stack = game_state.stacks[player]
		my_bet = game_state.bets_this_round[player]
		opp_bet = game_state.bets_this_round[1 - player]
		to_call = opp_bet - my_bet
		pot = game_state.pot

		# Fold is always available if facing a bet
		if to_call > 0:
			actions.append(Action.fold())

		# Check if not facing a bet
		if to_call == 0:
			actions.append(Action.check())

		# Call if facing a bet
		if to_call > 0 and my_stack > 0:
			if to_call >= my_stack:
				actions.append(Action.all_in(my_stack))
			else:
				actions.append(Action.call())

		# Add abstracted bet/raise sizes
		if my_stack > to_call:
			if game_state.street == Street.PREFLOP:
				# Preflop: use BB multipliers
				for mult in self._preflop_sizes:
					bet_size = int(mult * game_state.big_blind)
					if to_call == 0:
						# Open raise
						if bet_size <= my_stack:
							actions.append(Action.bet(bet_size))
					else:
						# 3-bet or higher
						raise_to = opp_bet + bet_size
						if raise_to - my_bet <= my_stack:
							actions.append(Action.raise_to(raise_to))
			else:
				# Postflop: use pot fractions
				for frac in self._postflop_sizes:
					bet_size = int(frac * pot)
					bet_size = max(bet_size, game_state.big_blind)

					if to_call == 0:
						# Bet
						if bet_size <= my_stack:
							actions.append(Action.bet(bet_size))
					else:
						# Raise
						raise_to = opp_bet + bet_size
						if raise_to - my_bet <= my_stack:
							actions.append(Action.raise_to(raise_to))

			# Always include all-in if configured
			if self._include_all_in and my_stack > to_call:
				all_in = Action.all_in(my_stack)
				if all_in not in actions:
					actions.append(all_in)

		return self._deduplicate_actions(actions)

	def _deduplicate_actions(self, actions: list[Action]) -> list[Action]:
		"""Remove duplicate actions."""
		seen = set()
		result = []
		for action in actions:
			key = (action.type, action.amount)
			if key not in seen:
				seen.add(key)
				result.append(action)
		return result

	def map_to_abstract(
		self,
		action: Action,
		game_state: GameState
	) -> Action:
		"""
		Map a real action to the nearest abstract action.

		Useful for mapping observed opponent actions during play.
		"""
		if action.type in (ActionType.FOLD, ActionType.CHECK, ActionType.CALL):
			return action

		if action.type == ActionType.ALL_IN:
			return action

		# For bet/raise, find nearest abstract size
		abstract_actions = self.get_abstract_actions(game_state)
		aggressive_actions = [
			a for a in abstract_actions
			if a.type in (ActionType.BET, ActionType.RAISE, ActionType.ALL_IN)
		]

		if not aggressive_actions:
			return action

		# Find closest by amount
		closest = min(
			aggressive_actions,
			key=lambda a: abs(a.amount - action.amount)
		)
		return closest

	def encode_action(self, action: Action, game_state: GameState) -> int:
		"""
		Encode action to an index for strategy arrays.

		Returns index in range [0, num_actions).
		"""
		abstract_actions = self.get_abstract_actions(game_state)
		try:
			return abstract_actions.index(action)
		except ValueError:
			# Map to closest abstract action
			mapped = self.map_to_abstract(action, game_state)
			return abstract_actions.index(mapped)

	def get_num_actions(self, game_state: GameState) -> int:
		"""Get number of abstract actions available."""
		return len(self.get_abstract_actions(game_state))

	@property
	def preflop_raise_sizes(self) -> list[float]:
		"""Preflop raise sizes as BB multipliers."""
		return self._preflop_sizes.copy()

	@property
	def postflop_bet_sizes(self) -> list[float]:
		"""Postflop bet sizes as pot fractions."""
		return self._postflop_sizes.copy()

