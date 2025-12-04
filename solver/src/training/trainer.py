"""
Training orchestration for CFR solvers.

Provides high-level training interface with checkpointing,
logging, and validation.
"""

import os
import json
import pickle
from datetime import datetime
from pathlib import Path
from typing import Optional, Union, TYPE_CHECKING

from ..cfr.cfr_plus import CFRPlusSolver, KuhnCFRSolver
from ..abstraction.hand_bucketing import HandBucketing
from ..abstraction.action_abstraction import ActionAbstraction

# Avoid circular import - DeepCFR imports from training
if TYPE_CHECKING:
		from ..cfr.deep_cfr import DeepCFR


class Trainer:
		"""
		High-level trainer for CFR solvers.

		Handles:
		- Training loop orchestration
		- Checkpointing
		- Logging
		- Validation
		"""

		def __init__(
				self,
				solver: Union[CFRPlusSolver, 'DeepCFR', KuhnCFRSolver],
				output_dir: str = 'checkpoints',
				checkpoint_every: int = 10000
		):
				"""
				Initialize trainer.

				Args:
						solver: CFR solver instance
						output_dir: Directory for checkpoints and logs
						checkpoint_every: Save checkpoint every N iterations
				"""
				self.solver = solver
				self.output_dir = Path(output_dir)
				self.checkpoint_every = checkpoint_every

				self.output_dir.mkdir(parents=True, exist_ok=True)

				self._start_time: Optional[datetime] = None
				self._iteration = 0
				self._log_file = self.output_dir / 'training.log'

		def train(
				self,
				iterations: int,
				verbose: bool = True
		) -> dict:
				"""
				Run training.

				Args:
						iterations: Number of CFR iterations
						verbose: Show progress

				Returns:
						Training statistics
				"""
				self._start_time = datetime.now()
				self._log(f'Starting training for {iterations} iterations')

				# Import here to avoid circular import
				from ..cfr.deep_cfr import DeepCFR

				# Determine solver type and train accordingly
				if isinstance(self.solver, KuhnCFRSolver):
						game_value = self.solver.train(iterations)
						self._log(
								f'Training complete. Game value: {game_value:.4f}'
						)
						self._save_kuhn_solution()
						return {'game_value': game_value}

				elif isinstance(self.solver, CFRPlusSolver):
						game_value = self.solver.train(
								iterations=iterations,
								checkpoint_every=self.checkpoint_every,
								verbose=verbose
						)
						self._log(
								f'Training complete. '
								f'Infosets: {self.solver.num_infosets}, '
								f'Game value: {game_value:.4f}'
						)
						self._save_tabular_solution()
						return {
								'game_value': game_value,
								'num_infosets': self.solver.num_infosets
						}

				elif isinstance(self.solver, DeepCFR):
						self.solver.train(
								iterations=iterations,
								verbose=verbose
						)
						self._log('Deep CFR training complete')
						self._save_deep_solution()
						return {'iterations': iterations}

				else:
						raise ValueError(f'Unknown solver type: {type(self.solver)}')

		def _save_kuhn_solution(self) -> None:
				"""Save Kuhn poker solution."""
				path = self.output_dir / 'kuhn_solution.json'

				solution = {}
				for card in ['J', 'Q', 'K']:
						solution[card] = self.solver.get_strategy(card)

				with open(path, 'w') as f:
						json.dump(solution, f, indent=2)

				self._log(f'Saved Kuhn solution to {path}')

		def _save_tabular_solution(self) -> None:
				"""Save tabular CFR solution."""
				path = self.output_dir / 'cfr_solution.pkl'

				# Extract strategies from information sets
				strategies = {}
				for key, infoset in self.solver.infoset_manager.items():
						strategies[key] = infoset.get_average_strategy().tolist()

				with open(path, 'wb') as f:
						pickle.dump(strategies, f)

				self._log(f'Saved CFR solution to {path}')

		def _save_deep_solution(self) -> None:
				"""Save Deep CFR model."""
				path = self.output_dir / 'deep_cfr_model.pt'
				self.solver.save(str(path))
				self._log(f'Saved Deep CFR model to {path}')

		def _log(self, message: str) -> None:
				"""Log message to file and stdout."""
				timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
				log_entry = f'[{timestamp}] {message}'
				print(log_entry)

				with open(self._log_file, 'a') as f:
						f.write(log_entry + '\n')

		def validate_kuhn(self) -> dict:
				"""
				Validate Kuhn poker solution against known Nash equilibrium.

				Expected:
				- Game value: -1/18 ≈ -0.0556
				- Jack bet frequency: 0 to 1/3
				- King bet frequency: 3x Jack bet frequency
				"""
				if not isinstance(self.solver, KuhnCFRSolver):
						raise ValueError('Can only validate Kuhn solver')

				game_value = self.solver.get_game_value()
				expected_value = -1/18

				jack_strategy = self.solver.get_strategy('J')
				king_strategy = self.solver.get_strategy('K')

				jack_bet = jack_strategy['bet']
				king_bet = king_strategy['bet']

				results = {
						'game_value': game_value,
						'expected_value': expected_value,
						'value_error': abs(game_value - expected_value),
						'jack_bet': jack_bet,
						'king_bet': king_bet,
						'jack_bet_valid': jack_bet <= 1/3 + 0.05,
						'king_bet_ratio': king_bet / jack_bet if jack_bet > 0.01 else None
				}

				self._log(f'Kuhn validation: {results}')
				return results


def create_cfr_trainer(
		solver_type: str = 'tabular',
		output_dir: str = 'checkpoints',
		**kwargs
) -> Trainer:
		"""
		Factory function to create a trainer.

		Args:
				solver_type: 'tabular', 'deep', or 'kuhn'
				output_dir: Output directory
				**kwargs: Additional solver arguments

		Returns:
				Configured Trainer instance
		"""
		if solver_type == 'kuhn':
				solver = KuhnCFRSolver()
		elif solver_type == 'tabular':
				hand_bucketing = HandBucketing(
						preflop_buckets=kwargs.get('preflop_buckets', 169),
						postflop_buckets=kwargs.get('postflop_buckets', 20)
				)
				action_abstraction = ActionAbstraction()
				solver = CFRPlusSolver(
						hand_bucketing=hand_bucketing,
						action_abstraction=action_abstraction,
						big_blind=kwargs.get('big_blind', 2),
						starting_stack=kwargs.get('starting_stack', 200)
				)
		elif solver_type == 'deep':
				# Import here to avoid circular import
				from ..cfr.deep_cfr import DeepCFR

				hand_bucketing = HandBucketing(
						preflop_buckets=kwargs.get('preflop_buckets', 169),
						postflop_buckets=kwargs.get('postflop_buckets', 20)
				)
				action_abstraction = ActionAbstraction()
				solver = DeepCFR(
						hand_bucketing=hand_bucketing,
						action_abstraction=action_abstraction,
						big_blind=kwargs.get('big_blind', 2),
						starting_stack=kwargs.get('starting_stack', 200),
						device=kwargs.get('device')
				)
		else:
				raise ValueError(f'Unknown solver type: {solver_type}')

		return Trainer(
				solver=solver,
				output_dir=output_dir,
				checkpoint_every=kwargs.get('checkpoint_every', 10000)
		)

