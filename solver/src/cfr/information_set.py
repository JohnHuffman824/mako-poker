"""
Information set representation for CFR.

An information set represents what a player knows at a decision point:
their cards and the action history, but not the opponent's cards.
"""

import numpy as np
from typing import Optional


class InformationSet:
	"""
	Stores regret and strategy information for a single information set.

	Used in CFR to track cumulative regrets and compute strategies.
	Implements CFR+ variant with non-negative regret clamping.
	"""

	def __init__(self, num_actions: int):
		"""
		Initialize an information set.

		Args:
			num_actions: Number of available actions at this decision point
		"""
		self.num_actions = num_actions
		self.cumulative_regrets = np.zeros(num_actions, dtype=np.float64)
		self.strategy_sum = np.zeros(num_actions, dtype=np.float64)

	def get_strategy(self, reach_probability: float = 1.0) -> np.ndarray:
		"""
		Get current strategy using regret matching.

		CFR+ variant: uses max(0, regret) for each action.

		Args:
			reach_probability: Probability of reaching this information set.
								Used for strategy averaging.

		Returns:
			Probability distribution over actions
		"""
		# Regret matching: strategy proportional to positive regrets
		strategy = np.maximum(0, self.cumulative_regrets)
		strategy = self._normalize(strategy)

		# Accumulate for average strategy computation
		self.strategy_sum += reach_probability * strategy

		return strategy

	def get_average_strategy(self) -> np.ndarray:
		"""
		Get the average strategy over all iterations.

		This converges to Nash equilibrium as iterations increase.

		Returns:
			Probability distribution over actions
		"""
		return self._normalize(self.strategy_sum.copy())

	def update_regrets(
		self,
		action_utilities: np.ndarray,
		counterfactual_reach: float
	) -> None:
		"""
		Update cumulative regrets based on action utilities.

		Args:
			action_utilities: Utility/EV for each action
			counterfactual_reach: Opponent's reach probability
		"""
		# Compute expected utility under current strategy
		strategy = np.maximum(0, self.cumulative_regrets)
		strategy = self._normalize(strategy)
		expected_utility = np.dot(strategy, action_utilities)

		# Compute regret for each action
		regrets = action_utilities - expected_utility

		# CFR+: accumulate regrets weighted by counterfactual reach
		self.cumulative_regrets += counterfactual_reach * regrets

		# CFR+ floor: clamp cumulative regrets to non-negative
		self.cumulative_regrets = np.maximum(0, self.cumulative_regrets)

	def _normalize(self, strategy: np.ndarray) -> np.ndarray:
		"""
		Normalize strategy to a valid probability distribution.

		If all values are zero/negative, returns uniform distribution.
		"""
		total = np.sum(strategy)
		if total > 0:
			return strategy / total
		else:
			return np.ones(self.num_actions) / self.num_actions

	def __repr__(self) -> str:
		avg = self.get_average_strategy()
		return f'InformationSet(actions={self.num_actions}, strategy={avg})'


class InformationSetManager:
	"""
	Manages collection of information sets for CFR training.

	Provides efficient lookup and creation of information sets.
	"""

	def __init__(self):
		"""Initialize the information set manager."""
		self._infosets: dict[str, InformationSet] = {}

	def get_or_create(
		self,
		key: str,
		num_actions: int
	) -> InformationSet:
		"""
		Get existing or create new information set.

		Args:
			key: Unique identifier for the information set
			num_actions: Number of actions (used only for creation)

		Returns:
			The InformationSet for this key
		"""
		if key not in self._infosets:
			self._infosets[key] = InformationSet(num_actions)
		return self._infosets[key]

	def get(self, key: str) -> Optional[InformationSet]:
		"""Get information set by key, or None if not found."""
		return self._infosets.get(key)

	def __len__(self) -> int:
		return len(self._infosets)

	def __contains__(self, key: str) -> bool:
		return key in self._infosets

	def __iter__(self):
		return iter(self._infosets.items())

	def keys(self):
		"""Return all information set keys."""
		return self._infosets.keys()

	def values(self):
		"""Return all information sets."""
		return self._infosets.values()

	def items(self):
		"""Return all (key, infoset) pairs."""
		return self._infosets.items()

	def get_strategy(self, key: str) -> Optional[np.ndarray]:
		"""Get average strategy for an information set."""
		infoset = self.get(key)
		if infoset is None:
			return None
		return infoset.get_average_strategy()

	def total_regret(self) -> float:
		"""Compute total regret across all information sets."""
		total = 0.0
		for infoset in self._infosets.values():
			total += np.sum(np.maximum(0, infoset.cumulative_regrets))
		return total

