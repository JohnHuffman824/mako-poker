from .value_network import PokerValueNetwork, ReservoirBuffer
from .onnx_export import (
	export_model_to_onnx,
	export_deep_cfr_models,
	verify_onnx_model,
	test_onnx_inference
)

# Trainer imported lazily to avoid circular import
def get_trainer():
	from .trainer import Trainer
	return Trainer

def create_cfr_trainer(*args, **kwargs):
	from .trainer import create_cfr_trainer as _create
	return _create(*args, **kwargs)

__all__ = [
	'PokerValueNetwork',
	'ReservoirBuffer',
	'get_trainer',
	'create_cfr_trainer',
	'export_model_to_onnx',
	'export_deep_cfr_models',
	'verify_onnx_model',
	'test_onnx_inference',
]

