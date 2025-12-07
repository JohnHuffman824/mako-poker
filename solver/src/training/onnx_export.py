"""
ONNX export utilities for trained poker models.

Exports PyTorch models to ONNX format for use in TypeScript inference.
"""

import os
from pathlib import Path
from typing import Optional

import torch
import torch.onnx

from .value_network import PokerValueNetwork


def export_model_to_onnx(
	model: PokerValueNetwork,
	output_path: str,
	opset_version: int = 14
) -> str:
	"""
	Export a trained PyTorch model to ONNX format.

	Args:
		model: Trained PokerValueNetwork
		output_path: Path to save the ONNX model
		opset_version: ONNX opset version (default 14 for broad compatibility)

	Returns:
		Path to the exported ONNX model
	"""
	model.eval()

	# Create dummy inputs matching the forward signature
	batch_size = 1
	max_history_len = 10

	dummy_bucket = torch.zeros(batch_size, dtype=torch.long)
	dummy_street = torch.zeros(batch_size, dtype=torch.long)
	dummy_pot_features = torch.zeros(batch_size, 4, dtype=torch.float32)
	dummy_action_history = torch.zeros(
		batch_size, max_history_len, dtype=torch.long
	)
	dummy_history_lengths = torch.tensor([1], dtype=torch.long)

	# Ensure output directory exists
	Path(output_path).parent.mkdir(parents=True, exist_ok=True)

	# Export with dynamic axes for variable batch size and history length
	torch.onnx.export(
		model,
		(
			dummy_bucket,
			dummy_street,
			dummy_pot_features,
			dummy_action_history,
			dummy_history_lengths
		),
		output_path,
		opset_version=opset_version,
		input_names=[
			'bucket',
			'street',
			'pot_features',
			'action_history',
			'history_lengths'
		],
		output_names=['action_values'],
		dynamic_axes={
			'bucket': {0: 'batch_size'},
			'street': {0: 'batch_size'},
			'pot_features': {0: 'batch_size'},
			'action_history': {0: 'batch_size', 1: 'seq_length'},
			'history_lengths': {0: 'batch_size'},
			'action_values': {0: 'batch_size'}
		}
	)

	print(f'Model exported to: {output_path}')
	return output_path


def export_deep_cfr_models(
	value_networks: list[PokerValueNetwork],
	strategy_network: PokerValueNetwork,
	output_dir: str,
	iteration: int
) -> dict[str, str]:
	"""
	Export all Deep CFR models to ONNX format.

	Args:
		value_networks: List of value networks (one per player)
		strategy_network: The strategy network for inference
		output_dir: Directory to save ONNX models
		iteration: Training iteration number for versioning

	Returns:
		Dictionary mapping model names to their file paths
	"""
	output_dir = Path(output_dir)
	output_dir.mkdir(parents=True, exist_ok=True)

	exported = {}

	# Export value networks
	for i, network in enumerate(value_networks):
		path = str(output_dir / f'value_network_p{i}_iter{iteration}.onnx')
		export_model_to_onnx(network, path)
		exported[f'value_network_p{i}'] = path

	# Export strategy network (this is what we use for inference)
	strategy_path = str(output_dir / f'strategy_network_iter{iteration}.onnx')
	export_model_to_onnx(strategy_network, strategy_path)
	exported['strategy_network'] = strategy_path

	# Also create a 'latest' symlink for easy access
	latest_path = output_dir / 'strategy_network_latest.onnx'
	if latest_path.exists():
		latest_path.unlink()
	latest_path.symlink_to(f'strategy_network_iter{iteration}.onnx')
	exported['strategy_network_latest'] = str(latest_path)

	print(f'Exported {len(exported)} models to {output_dir}')
	return exported


def verify_onnx_model(onnx_path: str) -> bool:
	"""
	Verify an ONNX model is valid and can be loaded.

	Args:
		onnx_path: Path to the ONNX model

	Returns:
		True if model is valid, False otherwise
	"""
	try:
		import onnx
		model = onnx.load(onnx_path)
		onnx.checker.check_model(model)
		print(f'ONNX model verified: {onnx_path}')
		return True
	except Exception as e:
		print(f'ONNX model verification failed: {e}')
		return False


def test_onnx_inference(onnx_path: str) -> bool:
	"""
	Test that ONNX model produces valid output with ONNX Runtime.

	Args:
		onnx_path: Path to the ONNX model

	Returns:
		True if inference succeeds, False otherwise
	"""
	try:
		import onnxruntime as ort
		import numpy as np

		session = ort.InferenceSession(onnx_path)

		# Create test inputs
		test_inputs = {
			'bucket': np.array([0], dtype=np.int64),
			'street': np.array([0], dtype=np.int64),
			'pot_features': np.array([[0.1, 0.5, 0.5, 0.0]], dtype=np.float32),
			'action_history': np.array([[0]], dtype=np.int64),
			'history_lengths': np.array([1], dtype=np.int64)
		}

		outputs = session.run(None, test_inputs)
		print(f'ONNX inference test passed. Output shape: {outputs[0].shape}')
		return True
	except Exception as e:
		print(f'ONNX inference test failed: {e}')
		return False


