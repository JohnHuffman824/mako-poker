"""
Deep CFR implementation using neural network function approximation.

Uses PyTorch with ROCm support for AMD GPU acceleration.
"""

import random
from typing import Optional
import numpy as np
import torch
import torch.nn as nn
import torch.optim as optim
from tqdm import tqdm

from ..enums import Rank, Suit
from ..game.card import Card
from ..game.deck import Deck
from ..game.game_state import GameState, Street
from ..game.action import Action
from ..abstraction.hand_bucketing import HandBucketing
from ..abstraction.action_abstraction import ActionAbstraction
from ..training.value_network import PokerValueNetwork, ReservoirBuffer


class DeepCFR:
		"""
		Deep Counterfactual Regret Minimization.

		Uses neural networks to approximate regret values instead of
		storing them explicitly in a table. This allows scaling to
		larger games where tabular CFR is infeasible.
		"""

		def __init__(
				self,
				hand_bucketing: Optional[HandBucketing] = None,
				action_abstraction: Optional[ActionAbstraction] = None,
				big_blind: int = 2,
				starting_stack: int = 200,
				device: Optional[str] = None
		):
				"""
				Initialize Deep CFR.

				Args:
						hand_bucketing: Hand bucketing abstraction
						action_abstraction: Action abstraction
						big_blind: Big blind size
						starting_stack: Starting stack per player
						device: Torch device ('cuda', 'cpu', or None for auto)
				"""
				self.hand_bucketing = hand_bucketing or HandBucketing()
				self.action_abstraction = action_abstraction or ActionAbstraction()
				self.big_blind = big_blind
				self.starting_stack = starting_stack

				# Auto-detect device (ROCm maps to 'cuda' in PyTorch)
				if device is None:
						self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
				else:
						self.device = device

				print(f'Using device: {self.device}')

				# Value networks for each player
				self.value_networks = [
						PokerValueNetwork().to(self.device),
						PokerValueNetwork().to(self.device)
				]

				# Strategy network (used at inference time)
				self.strategy_network = PokerValueNetwork().to(self.device)

				# Optimizers
				self.value_optimizers = [
						optim.Adam(net.parameters(), lr=1e-3)
						for net in self.value_networks
				]
				self.strategy_optimizer = optim.Adam(
						self.strategy_network.parameters(), lr=1e-3
				)

				# Replay buffers for advantage samples
				self.advantage_buffers = [
						ReservoirBuffer(max_size=2_000_000),
						ReservoirBuffer(max_size=2_000_000)
				]

				# Buffer for strategy samples
				self.strategy_buffer = ReservoirBuffer(max_size=2_000_000)

				self._iteration = 0

		def train(
				self,
				iterations: int,
				traversals_per_iter: int = 10000,
				train_every: int = 100,
				batch_size: int = 4096,
				verbose: bool = True
		) -> None:
				"""
				Train Deep CFR.

				Args:
						iterations: Number of CFR iterations
						traversals_per_iter: Game traversals per iteration
						train_every: Train networks every N traversals
						batch_size: Training batch size
						verbose: Show progress
				"""
				iterator = tqdm(range(iterations)) if verbose else range(iterations)

				for i in iterator:
						self._iteration = i + 1

						# Collect traversal samples
						for t in range(traversals_per_iter):
								# Alternate which player we're training
								traversing_player = t % 2

								# Deal random hands
								hole_cards = self._deal_random_hands()

								# Create initial state
								game_state = GameState.new_hand(
										hole_cards=hole_cards,
										stacks=[self.starting_stack, self.starting_stack],
										big_blind=self.big_blind
								)

								# Traverse game tree
								self._cfr_traverse(game_state, traversing_player)

								# Train networks periodically
								if (t + 1) % train_every == 0:
										self._train_networks(batch_size)

						# End of iteration: train more thoroughly
						for _ in range(10):
								self._train_networks(batch_size)

						if verbose and isinstance(iterator, tqdm):
								iterator.set_postfix({
										'adv_samples': sum(
												len(b) for b in self.advantage_buffers
										),
										'strat_samples': len(self.strategy_buffer)
								})

		def _deal_random_hands(self) -> tuple[list[Card], list[Card]]:
				"""Deal random hole cards."""
				deck = Deck().shuffle()
				return (deck.deal(2), deck.deal(2))

		def _cfr_traverse(
				self,
				game_state: GameState,
				traversing_player: int
		) -> float:
				"""
				Traverse game tree collecting advantage samples.

				Args:
						game_state: Current state
						traversing_player: Player we're optimizing for

				Returns:
						Expected utility
				"""
				if game_state.is_terminal:
						return game_state.get_payoff(traversing_player)

				current_player = game_state.current_player
				actions = self.action_abstraction.get_abstract_actions(game_state)

				if not actions:
						return 0.0

				# Get strategy from network
				strategy = self._get_network_strategy(game_state, current_player)
				strategy = strategy[:len(actions)]  # Trim to valid actions
				strategy = self._normalize(strategy)

				if current_player == traversing_player:
						# Traversing player: compute advantages
						action_values = np.zeros(len(actions))

						for i, action in enumerate(actions):
								new_state = game_state.apply_action(action)
								action_values[i] = self._cfr_traverse(
										new_state, traversing_player
								)

						# Compute expected value and advantages
						expected_value = np.dot(strategy, action_values)
						advantages = action_values - expected_value

						# Store advantage sample
						sample = self._create_sample(
								game_state, current_player, advantages
						)
						self.advantage_buffers[current_player].add(sample)

						return expected_value

				else:
						# Opponent: sample according to strategy
						action_idx = np.random.choice(len(actions), p=strategy)
						action = actions[action_idx]

						# Store strategy sample
						sample = self._create_sample(
								game_state, current_player, strategy
						)
						self.strategy_buffer.add(sample)

						new_state = game_state.apply_action(action)
						return self._cfr_traverse(new_state, traversing_player)

		def _get_network_strategy(
				self,
				game_state: GameState,
				player: int
		) -> np.ndarray:
				"""Get strategy from value network."""
				features = self._extract_features(game_state, player)

				with torch.no_grad():
						values = self.value_networks[player].predict(
								bucket=features['bucket'],
								street=features['street'],
								pot_features=features['pot_features'],
								action_history=features['action_history'],
								device=self.device
						)

				# Convert advantages to strategy via regret matching
				values_np = values.cpu().numpy()
				strategy = np.maximum(0, values_np)
				return self._normalize(strategy)

		def _extract_features(
				self,
				game_state: GameState,
				player: int
		) -> dict:
				"""Extract neural network features from game state."""
				bucket = self.hand_bucketing.get_bucket(
						game_state.hole_cards[player],
						game_state.community_cards if game_state.community_cards else None
				)

				street = game_state.street.value

				# Pot features: normalized pot size, stack ratios, etc.
				total_chips = 2 * self.starting_stack
				pot_features = [
						game_state.pot / total_chips,
						game_state.stacks[player] / self.starting_stack,
						game_state.stacks[1 - player] / self.starting_stack,
						game_state.bets_this_round[player] / max(1, game_state.pot)
				]

				# Encode action history as indices
				actions = self.action_abstraction.get_abstract_actions(game_state)
				action_history = []
				for action in game_state.action_history:
						try:
								idx = self.action_abstraction.encode_action(action, game_state)
								action_history.append(idx + 1)  # +1 for 0 padding
						except ValueError:
								action_history.append(0)

				if not action_history:
						action_history = [0]

				return {
						'bucket': bucket,
						'street': street,
						'pot_features': pot_features,
						'action_history': action_history
				}

		def _create_sample(
				self,
				game_state: GameState,
				player: int,
				target: np.ndarray
		) -> tuple:
				"""Create training sample from game state."""
				features = self._extract_features(game_state, player)
				return (features, target.copy())

		def _train_networks(self, batch_size: int) -> None:
				"""Train value and strategy networks."""
				# Train value networks
				for player in range(2):
						if len(self.advantage_buffers[player]) < batch_size:
								continue

						samples = self.advantage_buffers[player].sample(batch_size)
						self._train_network(
								self.value_networks[player],
								self.value_optimizers[player],
								samples
						)

				# Train strategy network
				if len(self.strategy_buffer) >= batch_size:
						samples = self.strategy_buffer.sample(batch_size)
						self._train_network(
								self.strategy_network,
								self.strategy_optimizer,
								samples
						)

		def _train_network(
				self,
				network: nn.Module,
				optimizer: optim.Optimizer,
				samples: list
		) -> float:
				"""Train a network on batch of samples."""
				network.train()

				# Prepare batch
				buckets = []
				streets = []
				pot_features = []
				histories = []
				lengths = []
				targets = []

				max_len = 1

				for features, target in samples:
						buckets.append(features['bucket'])
						streets.append(features['street'])
						pot_features.append(features['pot_features'])
						histories.append(features['action_history'])
						lengths.append(len(features['action_history']))
						targets.append(target)
						max_len = max(max_len, len(features['action_history']))

				# Pad histories
				padded_histories = []
				for h in histories:
						padded = h + [0] * (max_len - len(h))
						padded_histories.append(padded)

				# Convert to tensors
				bucket_t = torch.tensor(buckets, device=self.device)
				street_t = torch.tensor(streets, device=self.device)
				pot_t = torch.tensor(
						pot_features, dtype=torch.float32, device=self.device
				)
				history_t = torch.tensor(padded_histories, device=self.device)
				length_t = torch.tensor(lengths, device=self.device)

				# Pad targets to network output size
				padded_targets = []
				for t in targets:
						padded = np.zeros(network.num_actions)
						padded[:len(t)] = t
						padded_targets.append(padded)
				target_t = torch.tensor(
						padded_targets, dtype=torch.float32, device=self.device
				)

				# Forward pass
				predictions = network(bucket_t, street_t, pot_t, history_t, length_t)

				# MSE loss
				loss = nn.functional.mse_loss(predictions, target_t)

				# Backward pass
				optimizer.zero_grad()
				loss.backward()
				optimizer.step()

				return loss.item()

		def _normalize(self, strategy: np.ndarray) -> np.ndarray:
				"""Normalize to valid probability distribution."""
				total = np.sum(strategy)
				if total > 0:
						return strategy / total
				return np.ones(len(strategy)) / len(strategy)

		def get_strategy(
				self,
				game_state: GameState,
				player: int
		) -> np.ndarray:
				"""
				Get learned strategy for a game state.

				Args:
						game_state: Current game state
						player: Player to get strategy for

				Returns:
						Probability distribution over actions
				"""
				features = self._extract_features(game_state, player)

				with torch.no_grad():
						self.strategy_network.eval()
						values = self.strategy_network.predict(
								bucket=features['bucket'],
								street=features['street'],
								pot_features=features['pot_features'],
								action_history=features['action_history'],
								device=self.device
						)

				# Convert to probabilities
				probs = torch.softmax(values, dim=-1)
				return probs.cpu().numpy()

		def save(self, path: str) -> None:
				"""Save model checkpoints."""
				torch.save({
						'value_networks': [n.state_dict() for n in self.value_networks],
						'strategy_network': self.strategy_network.state_dict(),
						'iteration': self._iteration
				}, path)

		def load(self, path: str) -> None:
				"""Load model checkpoints."""
				checkpoint = torch.load(path, map_location=self.device)

				for i, state_dict in enumerate(checkpoint['value_networks']):
						self.value_networks[i].load_state_dict(state_dict)

				self.strategy_network.load_state_dict(checkpoint['strategy_network'])
				self._iteration = checkpoint['iteration']

