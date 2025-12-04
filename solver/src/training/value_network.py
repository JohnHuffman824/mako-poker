"""
Neural network for Deep CFR value approximation.

Uses PyTorch with ROCm support for AMD GPUs.
"""

import torch
import torch.nn as nn
import torch.nn.functional as F
from typing import Optional


class PokerValueNetwork(nn.Module):
	"""
	Neural network for approximating counterfactual values.

	Input features:
	- Hand bucket (embedded)
	- Board texture features
	- Pot/stack ratios
	- Action history encoding

	Output:
	- Expected value for each abstract action
	"""

	def __init__(
		self,
		num_buckets: int = 169,
		embed_dim: int = 32,
		hidden_dim: int = 256,
		num_actions: int = 7,
		num_streets: int = 4,
		history_dim: int = 64
	):
		"""
		Initialize the value network.

		Args:
			num_buckets: Number of hand buckets
			embed_dim: Embedding dimension for buckets
			hidden_dim: Hidden layer dimension
			num_actions: Maximum number of abstract actions
			num_streets: Number of betting streets (4 for NLHE)
			history_dim: Dimension for action history encoding
		"""
		super().__init__()

		self.num_buckets = num_buckets
		self.num_actions = num_actions

		# Embeddings
		self.bucket_embed = nn.Embedding(num_buckets, embed_dim)
		self.street_embed = nn.Embedding(num_streets, 8)

		# Feature sizes
		# bucket_embed + street_embed + pot_features + history
		input_dim = embed_dim + 8 + 4 + history_dim

		# Main network
		self.network = nn.Sequential(
			nn.Linear(input_dim, hidden_dim),
			nn.ReLU(),
			nn.BatchNorm1d(hidden_dim),
			nn.Dropout(0.1),

			nn.Linear(hidden_dim, hidden_dim),
			nn.ReLU(),
			nn.BatchNorm1d(hidden_dim),
			nn.Dropout(0.1),

			nn.Linear(hidden_dim, hidden_dim // 2),
			nn.ReLU(),

			nn.Linear(hidden_dim // 2, num_actions)
		)

		# History encoder (LSTM for variable-length action sequences)
		self.history_encoder = nn.LSTM(
			input_size=16,  # Action encoding size
			hidden_size=history_dim // 2,
			num_layers=1,
			batch_first=True,
			bidirectional=True
		)

		# Action embedding for history encoding
		self.action_embed = nn.Embedding(num_actions + 1, 16)  # +1 for padding

		self._init_weights()

	def _init_weights(self):
		"""Initialize network weights."""
		for module in self.modules():
			if isinstance(module, nn.Linear):
				nn.init.xavier_uniform_(module.weight)
				if module.bias is not None:
					nn.init.zeros_(module.bias)
			elif isinstance(module, nn.Embedding):
				nn.init.normal_(module.weight, mean=0, std=0.1)

	def forward(
		self,
		bucket: torch.Tensor,
		street: torch.Tensor,
		pot_features: torch.Tensor,
		action_history: torch.Tensor,
		history_lengths: torch.Tensor
	) -> torch.Tensor:
		"""
		Forward pass.

		Args:
			bucket: Hand bucket indices (batch_size,)
			street: Street indices (batch_size,)
			pot_features: Pot/stack features (batch_size, 4)
			action_history: Padded action sequences (batch_size, max_len)
			history_lengths: Actual lengths of histories (batch_size,)

		Returns:
			Action values (batch_size, num_actions)
		"""
		batch_size = bucket.size(0)

		# Embed bucket and street
		bucket_emb = self.bucket_embed(bucket)  # (batch, embed_dim)
		street_emb = self.street_embed(street)  # (batch, 8)

		# Encode action history
		history_emb = self.action_embed(action_history)  # (batch, seq, 16)

		# Pack for LSTM
		packed = nn.utils.rnn.pack_padded_sequence(
			history_emb,
			history_lengths.cpu(),
			batch_first=True,
			enforce_sorted=False
		)
		_, (hidden, _) = self.history_encoder(packed)

		# Concatenate bidirectional hidden states
		history_enc = torch.cat(
			[hidden[0], hidden[1]], dim=-1
		)  # (batch, history_dim)

		# Concatenate all features
		features = torch.cat([
			bucket_emb,
			street_emb,
			pot_features,
			history_enc
		], dim=-1)

		# Forward through network
		return self.network(features)

	def predict(
		self,
		bucket: int,
		street: int,
		pot_features: list[float],
		action_history: list[int],
		device: str = 'cpu'
	) -> torch.Tensor:
		"""
		Convenience method for single prediction.

		Args:
			bucket: Hand bucket index
			street: Street index (0-3)
			pot_features: [pot_ratio, stack_ratio, bet_ratio, ...]
			action_history: List of action indices
			device: Device to run on

		Returns:
			Action values tensor
		"""
		self.eval()

		with torch.no_grad():
			bucket_t = torch.tensor([bucket], device=device)
			street_t = torch.tensor([street], device=device)
			pot_t = torch.tensor([pot_features], dtype=torch.float32, device=device)

			# Pad history
			if len(action_history) == 0:
				action_history = [0]  # Padding token
			history_t = torch.tensor([action_history], device=device)
			lengths_t = torch.tensor([len(action_history)], device=device)

			return self(bucket_t, street_t, pot_t, history_t, lengths_t)[0]


class ReservoirBuffer:
	"""
	Reservoir sampling buffer for storing training samples.

	Used in Deep CFR to store advantage samples with bounded memory.
	"""

	def __init__(self, max_size: int = 1_000_000):
		"""
		Initialize reservoir buffer.

		Args:
			max_size: Maximum number of samples to store
		"""
		self.max_size = max_size
		self.buffer: list = []
		self.count = 0

	def add(self, sample: tuple) -> None:
		"""
		Add a sample using reservoir sampling.

		Args:
			sample: Tuple of (features, target)
		"""
		self.count += 1

		if len(self.buffer) < self.max_size:
			self.buffer.append(sample)
		else:
			# Reservoir sampling
			import random
			idx = random.randint(0, self.count - 1)
			if idx < self.max_size:
				self.buffer[idx] = sample

	def sample(self, batch_size: int) -> list:
		"""
		Sample a batch from the buffer.

		Args:
			batch_size: Number of samples to return

		Returns:
			List of samples
		"""
		import random
		return random.sample(
			self.buffer,
			min(batch_size, len(self.buffer))
		)

	def __len__(self) -> int:
		return len(self.buffer)

	def clear(self) -> None:
		"""Clear the buffer."""
		self.buffer.clear()
		self.count = 0

