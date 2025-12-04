"""
CFR+ (Counterfactual Regret Minimization Plus) solver.

Implements the CFR+ algorithm for finding Nash equilibrium strategies
in extensive-form games like poker.
"""

import random
from typing import Optional
import numpy as np
from tqdm import tqdm

from .information_set import InformationSet, InformationSetManager
from ..enums import Rank, Suit
from ..game.card import Card
from ..game.deck import Deck
from ..game.game_state import GameState, Street
from ..game.action import Action
from ..abstraction.hand_bucketing import HandBucketing
from ..abstraction.action_abstraction import ActionAbstraction


class CFRPlusSolver:
	"""
	CFR+ solver for Heads-Up No-Limit Texas Hold'em.

	Uses hand and action abstractions to make the game tree tractable.
	"""

	def __init__(
		self,
		hand_bucketing: Optional[HandBucketing] = None,
		action_abstraction: Optional[ActionAbstraction] = None,
		big_blind: int = 2,
		starting_stack: int = 200
	):
		"""
		Initialize the CFR+ solver.

		Args:
			hand_bucketing: Hand bucketing abstraction
			action_abstraction: Action abstraction
			big_blind: Big blind size
			starting_stack: Starting stack size per player
		"""
		self.hand_bucketing = hand_bucketing or HandBucketing()
		self.action_abstraction = action_abstraction or ActionAbstraction()
		self.big_blind = big_blind
		self.starting_stack = starting_stack

		self.infoset_manager = InformationSetManager()
		self._iteration = 0
		self._total_utility = 0.0

	def train(
		self,
		iterations: int,
		checkpoint_every: int = 10000,
		output_dir: Optional[str] = None,
		verbose: bool = True
	) -> float:
		"""
		Train CFR+ for specified number of iterations.

		Args:
			iterations: Number of CFR iterations
			checkpoint_every: Save checkpoint every N iterations
			output_dir: Directory for checkpoints
			verbose: Show progress bar

		Returns:
			Average game value
		"""
		iterator = tqdm(range(iterations)) if verbose else range(iterations)

		for i in iterator:
			self._iteration = i + 1

			# Deal random hands
			hole_cards = self._deal_random_hands()

			# Create initial game state
			game_state = GameState.new_hand(
				hole_cards=hole_cards,
				stacks=[self.starting_stack, self.starting_stack],
				big_blind=self.big_blind
			)

			# CFR traversal from root
			reach_probs = np.ones(2)
			utility = self._cfr_traverse(game_state, reach_probs, 0)
			self._total_utility += utility

			# Update progress bar
			if verbose and isinstance(iterator, tqdm):
				iterator.set_postfix({
					'infosets': len(self.infoset_manager),
					'avg_util': self._total_utility / (i + 1)
				})

		return self._total_utility / iterations

	def _deal_random_hands(self) -> tuple[list[Card], list[Card]]:
		"""Deal random hole cards to both players."""
		deck = Deck().shuffle()
		p0_cards = deck.deal(2)
		p1_cards = deck.deal(2)
		return (p0_cards, p1_cards)

	def _cfr_traverse(
		self,
		game_state: GameState,
		reach_probs: np.ndarray,
		traversing_player: int
	) -> float:
		"""
		Recursive CFR traversal.

		Args:
			game_state: Current game state
			reach_probs: Reach probabilities for each player
			traversing_player: Player whose utility we're computing

		Returns:
			Expected utility for traversing player
		"""
		# Terminal node: return payoff
		if game_state.is_terminal:
			return game_state.get_payoff(traversing_player)

		current_player = game_state.current_player
		opponent = 1 - current_player

		# Get abstract actions
		actions = self.action_abstraction.get_abstract_actions(game_state)
		if not actions:
			# No legal actions (shouldn't happen)
			return 0.0

		num_actions = len(actions)

		# Build information set key
		infoset_key = self._build_infoset_key(game_state, current_player)

		# Get or create information set
		infoset = self.infoset_manager.get_or_create(infoset_key, num_actions)

		# Get current strategy
		strategy = infoset.get_strategy(reach_probs[current_player])

		# Compute counterfactual values for each action
		action_utilities = np.zeros(num_actions)

		for i, action in enumerate(actions):
			# Apply action
			new_state = game_state.apply_action(action)

			# Update reach probabilities
			new_reach = reach_probs.copy()
			new_reach[current_player] *= strategy[i]

			# Recurse
			action_utilities[i] = self._cfr_traverse(
				new_state, new_reach, traversing_player
			)

		# Compute expected utility
		node_utility = np.dot(strategy, action_utilities)

		# Update regrets if this is the traversing player's decision
		if current_player == traversing_player:
			# Counterfactual reach is opponent's reach probability
			cf_reach = reach_probs[opponent]

			# Compute regrets
			regrets = action_utilities - node_utility

			# Update information set
			infoset.cumulative_regrets += cf_reach * regrets

			# CFR+ floor
			infoset.cumulative_regrets = np.maximum(
				0, infoset.cumulative_regrets
			)

		return node_utility

	def _build_infoset_key(
		self,
		game_state: GameState,
		player: int
	) -> str:
		"""
		Build unique key for information set.

		Combines hand bucket, street, and action history.
		"""
		# Get hand bucket
		bucket = self.hand_bucketing.get_bucket(
			game_state.hole_cards[player],
			game_state.community_cards if game_state.community_cards else None
		)

		# Encode action history
		history = game_state.encode_history()

		# Combine into key
		return f'{bucket}:{game_state.street.name}:{history}'

	def get_strategy(self, infoset_key: str) -> Optional[np.ndarray]:
		"""
		Get the computed strategy for an information set.

		Returns:
			Probability distribution over actions, or None if not found
		"""
		return self.infoset_manager.get_strategy(infoset_key)

	def get_game_value(self) -> float:
		"""Get average game value from training."""
		if self._iteration == 0:
			return 0.0
		return self._total_utility / self._iteration

	@property
	def num_infosets(self) -> int:
		"""Number of information sets discovered."""
		return len(self.infoset_manager)


class KuhnCFRSolver:
	"""
	CFR solver for Kuhn Poker.

	Used to validate CFR implementation against known Nash equilibrium.
	Kuhn Poker has a known solution:
	- Expected game value for P1: -1/18
	- Jack bet frequency: 0 to 1/3
	- King bet frequency: 3x Jack frequency
	"""

	ACTIONS = ['bet', 'check']  # or pass

	def __init__(self):
		"""Initialize Kuhn poker CFR solver."""
		self.infoset_map: dict[str, InformationSet] = {}
		self._total_utility = 0.0
		self._iterations = 0

	def train(self, iterations: int = 100000) -> float:
		"""
		Train CFR for Kuhn poker.

		Args:
			iterations: Number of iterations

		Returns:
			Average game value for player 0
		"""
		cards = ['J', 'Q', 'K']

		for _ in range(iterations):
			# Shuffle and deal
			random.shuffle(cards)
			dealt = cards[:2]  # Player 0 and 1 get one card each

			# CFR from root
			utility = self._cfr(dealt, '', np.ones(2), 0)
			self._total_utility += utility
			self._iterations += 1

		return self._total_utility / iterations

	def _cfr(
		self,
		cards: list[str],
		history: str,
		reach_probs: np.ndarray,
		active_player: int
	) -> float:
		"""
		CFR traversal for Kuhn poker.

		Args:
			cards: [player0_card, player1_card]
			history: Action history string
			reach_probs: Reach probabilities
			active_player: Current player

		Returns:
			Expected utility for the active_player
		"""
		# Check terminal states
		if self._is_terminal(history):
			return self._get_payoff(history, cards)

		opponent = 1 - active_player
		my_card = cards[active_player]
		infoset_key = my_card + history

		# Get or create information set
		if infoset_key not in self.infoset_map:
			self.infoset_map[infoset_key] = InformationSet(2)
		infoset = self.infoset_map[infoset_key]

		# Get strategy
		strategy = infoset.get_strategy(reach_probs[active_player])

		# Compute action utilities
		action_utilities = np.zeros(2)

		for i, action in enumerate(self.ACTIONS):
			action_char = 'b' if action == 'bet' else 'c'
			new_history = history + action_char

			# Update reach probabilities
			new_reach = reach_probs.copy()
			new_reach[active_player] *= strategy[i]

			# Recurse (note: Kuhn alternates players)
			action_utilities[i] = -self._cfr(
				cards, new_history, new_reach, opponent
			)

		# Expected utility
		node_utility = np.dot(strategy, action_utilities)

		# Update regrets
		cf_reach = reach_probs[opponent]
		regrets = action_utilities - node_utility
		infoset.cumulative_regrets += cf_reach * regrets

		# CFR+ floor
		infoset.cumulative_regrets = np.maximum(0, infoset.cumulative_regrets)

		return node_utility

	def _is_terminal(self, history: str) -> bool:
		"""Check if game has ended."""
		return history in ['bc', 'bb', 'cc', 'cbb', 'cbc']

	def _get_payoff(self, history: str, cards: list[str]) -> float:
		"""
		Get payoff for the ACTIVE player at terminal state.

		Active player is determined by len(history) % 2.
		This matches the convention where the recursive CFR call
		expects payoff from the perspective of the current player.

		Payoffs:
		- bc (bet-fold): +1 for bettor (player 0)
		- cbc (check-bet-fold): +1 for bettor (player 1)
		- cc (check-check): based on card comparison
		- bb (bet-call): based on card comparison
		- cbb (check-bet-call): based on card comparison
		"""
		# Determine active player at this terminal node
		active_player = len(history) % 2

		if history in ['bc', 'cbc']:
			# Someone folded - bettor wins +1
			# In 'bc': player 0 bet, player 1 folded. Active = 0, bettor = 0.
			# In 'cbc': player 0 checked, player 1 bet, player 0 folded.
			#           Active = 1, bettor = 1.
			# In both cases, active player is the bettor, so return +1
			return 1

		# Showdown - compare cards
		pot = 2 if 'b' in history else 1

		active_card = cards[active_player]
		opponent_card = cards[1 - active_player]

		# K > Q > J
		if active_card == 'K' or opponent_card == 'J':
			return pot
		else:
			return -pot

	def get_strategy(self, card: str) -> dict[str, float]:
		"""
		Get average strategy for a starting card.

		Args:
			card: 'J', 'Q', or 'K'

		Returns:
			Dict with 'bet' and 'check' probabilities
		"""
		key = card  # At game start, history is empty
		if key not in self.infoset_map:
			return {'bet': 0.5, 'check': 0.5}

		strategy = self.infoset_map[key].get_average_strategy()
		return {'bet': strategy[0], 'check': strategy[1]}

	def get_game_value(self) -> float:
		"""Get average game value."""
		if self._iterations == 0:
			return 0.0
		return self._total_utility / self._iterations

	def print_strategies(self) -> None:
		"""Print all computed strategies."""
		print('\nKuhn Poker Strategies:')
		print('-' * 40)
		for key, infoset in sorted(self.infoset_map.items()):
			strategy = infoset.get_average_strategy()
			print(f'{key:4}: bet={strategy[0]:.3f}, check={strategy[1]:.3f}')

