from .value_network import PokerValueNetwork, ReservoirBuffer

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
]

