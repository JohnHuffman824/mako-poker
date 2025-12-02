from .information_set import InformationSet
from .cfr_plus import CFRPlusSolver, KuhnCFRSolver

# DeepCFR imported lazily to avoid circular import with training module
def get_deep_cfr():
    from .deep_cfr import DeepCFR
    return DeepCFR

__all__ = [
    'InformationSet',
    'CFRPlusSolver',
    'KuhnCFRSolver',
    'get_deep_cfr',
]

