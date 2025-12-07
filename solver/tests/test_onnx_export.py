"""
Tests for ONNX model export functionality.
"""

import os
import tempfile
import unittest

import torch

from src.training.value_network import PokerValueNetwork
from src.training.onnx_export import (
	export_model_to_onnx,
	export_deep_cfr_models,
	verify_onnx_model,
	test_onnx_inference
)


class TestOnnxExport(unittest.TestCase):
	"""Tests for ONNX export utilities."""

	def setUp(self):
		"""Create a test model."""
		self.model = PokerValueNetwork(
			num_buckets=169,
			embed_dim=16,
			hidden_dim=64,
			num_actions=7
		)
		self.temp_dir = tempfile.mkdtemp()

	def test_export_single_model(self):
		"""Test exporting a single model to ONNX."""
		output_path = os.path.join(self.temp_dir, 'test_model.onnx')

		result = export_model_to_onnx(self.model, output_path)

		self.assertEqual(result, output_path)
		self.assertTrue(os.path.exists(output_path))
		self.assertGreater(os.path.getsize(output_path), 0)

	def test_verify_exported_model(self):
		"""Test that exported model passes ONNX validation."""
		output_path = os.path.join(self.temp_dir, 'verified_model.onnx')
		export_model_to_onnx(self.model, output_path)

		is_valid = verify_onnx_model(output_path)

		self.assertTrue(is_valid)

	def test_onnx_inference(self):
		"""Test that exported model produces valid output."""
		output_path = os.path.join(self.temp_dir, 'inference_model.onnx')
		export_model_to_onnx(self.model, output_path)

		inference_works = test_onnx_inference(output_path)

		self.assertTrue(inference_works)

	def test_export_deep_cfr_models(self):
		"""Test exporting all Deep CFR models."""
		value_networks = [
			PokerValueNetwork(num_buckets=169, embed_dim=16, hidden_dim=64),
			PokerValueNetwork(num_buckets=169, embed_dim=16, hidden_dim=64)
		]
		strategy_network = PokerValueNetwork(
			num_buckets=169, embed_dim=16, hidden_dim=64
		)

		exported = export_deep_cfr_models(
			value_networks=value_networks,
			strategy_network=strategy_network,
			output_dir=self.temp_dir,
			iteration=100
		)

		self.assertIn('value_network_p0', exported)
		self.assertIn('value_network_p1', exported)
		self.assertIn('strategy_network', exported)
		self.assertIn('strategy_network_latest', exported)

		# Verify all files exist
		for name, path in exported.items():
			self.assertTrue(
				os.path.exists(path),
				f'Missing file for {name}: {path}'
			)

	def test_output_shape(self):
		"""Test that ONNX model output has correct shape."""
		import onnxruntime as ort
		import numpy as np

		output_path = os.path.join(self.temp_dir, 'shape_test.onnx')
		export_model_to_onnx(self.model, output_path)

		session = ort.InferenceSession(output_path)

		batch_size = 4
		seq_length = 5
		inputs = {
			'bucket': np.zeros(batch_size, dtype=np.int64),
			'street': np.zeros(batch_size, dtype=np.int64),
			'pot_features': np.zeros((batch_size, 4), dtype=np.float32),
			'action_history': np.zeros((batch_size, seq_length), dtype=np.int64),
			'history_lengths': np.ones(batch_size, dtype=np.int64) * seq_length
		}

		outputs = session.run(None, inputs)

		# Output should be (batch_size, num_actions)
		self.assertEqual(outputs[0].shape, (batch_size, 7))

	def test_export_creates_directory(self):
		"""Test that export creates output directory if needed."""
		nested_path = os.path.join(
			self.temp_dir, 'nested', 'dir', 'model.onnx'
		)

		export_model_to_onnx(self.model, nested_path)

		self.assertTrue(os.path.exists(nested_path))

	def tearDown(self):
		"""Clean up temporary files."""
		import shutil
		shutil.rmtree(self.temp_dir, ignore_errors=True)


if __name__ == '__main__':
	unittest.main()


