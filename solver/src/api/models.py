"""
Pydantic models for API request/response validation.

Uses the Card class from game/card.py directly - no separate CardModel.
"""

from typing import Optional, Any
from pydantic import BaseModel, Field, field_validator, model_validator

from ..enums import ActionTypeEnum, PositionEnum, StreetEnum, HealthStatusEnum
from ..enums import Rank, Suit
from ..game.card import Card


class StrategyAction(BaseModel):
	"""Represents a single action in the recommended strategy."""
	action: ActionTypeEnum = Field(
		description='Action type (fold, check, call, bet, raise, all_in)'
	)
	amount: int = Field(
		default=0,
		ge=0,
		description='Bet/raise amount (0 for fold/check/call)'
	)
	probability: float = Field(
		ge=0.0, le=1.0,
		description='Probability of taking this action in GTO strategy'
	)
	ev: Optional[float] = Field(
		default=None,
		description='Expected value of this action'
	)


class SolveRequest(BaseModel):
	"""
	Request to solve a poker scenario for GTO strategy.

	Cards must be provided as structured objects:
	{"rank": "A", "suit": "s"} for Ace of Spades
	"""
	hole_cards: list[dict[str, str]] = Field(
		min_length=2, max_length=2,
		description='Player hole cards as {rank, suit} objects'
	)
	community_cards: list[dict[str, str]] = Field(
		default=[],
		max_length=5,
		description='Community cards as {rank, suit} objects'
	)
	pot: int = Field(gt=0, description='Current pot size')
	stack: int = Field(gt=0, description='Player remaining stack')
	opponent_stack: int = Field(gt=0, description='Opponent remaining stack')
	position: PositionEnum = Field(
		default=PositionEnum.BTN,
		description='Player position at the table'
	)
	to_call: int = Field(
		default=0, ge=0,
		description='Amount needed to call (0 if not facing bet)'
	)
	big_blind: int = Field(default=2, gt=0, description='Big blind size')

	@field_validator('hole_cards', 'community_cards', mode='after')
	@classmethod
	def validate_cards(cls, cards: list[dict[str, str]]) -> list[dict[str, str]]:
		"""Validate card structure has required fields."""
		for card in cards:
			if 'rank' not in card or 'suit' not in card:
				raise ValueError(
					'Card must have "rank" and "suit" fields'
				)
			# Validate rank
			try:
				Rank.from_symbol(card['rank'])
			except ValueError:
				raise ValueError(f'Invalid rank: {card["rank"]}')
			# Validate suit
			try:
				Suit.from_symbol(card['suit'])
			except ValueError:
				raise ValueError(f'Invalid suit: {card["suit"]}')
		return cards

	@model_validator(mode='after')
	def validate_no_duplicate_cards(self):
		"""Ensure no duplicate cards in hole + community."""
		all_cards = self.hole_cards + self.community_cards
		card_keys = [(c['rank'], c['suit']) for c in all_cards]
		if len(card_keys) != len(set(card_keys)):
			raise ValueError('Duplicate cards detected')
		return self

	def _convert_cards(self, card_dicts: list[dict[str, str]]) -> list[Card]:
		"""Convert card dicts to Card objects."""
		return [
			Card(
				rank=Rank.from_symbol(c['rank']),
				suit=Suit.from_symbol(c['suit'])
			)
			for c in card_dicts
		]

	def get_hole_cards(self) -> list[Card]:
		"""Get hole cards as Card objects."""
		return self._convert_cards(self.hole_cards)

	def get_community_cards(self) -> list[Card]:
		"""Get community cards as Card objects."""
		return self._convert_cards(self.community_cards)


class SolveResponse(BaseModel):
	"""Response containing GTO strategy for the scenario."""
	strategy: list[StrategyAction] = Field(
		description='List of actions with probabilities'
	)
	recommended_action: ActionTypeEnum = Field(
		description='Single recommended action (highest probability)'
	)
	recommended_amount: int = Field(
		default=0,
		ge=0,
		description='Amount for recommended action'
	)
	confidence: float = Field(
		ge=0.0, le=1.0,
		description='Confidence in the recommendation'
	)
	hand_bucket: int = Field(
		ge=0,
		description='Hand strength bucket used'
	)
	street: StreetEnum = Field(description='Current betting street')
	solve_time_ms: float = Field(
		ge=0,
		description='Time taken to solve in milliseconds'
	)


class HealthResponse(BaseModel):
	"""Health check response."""
	status: HealthStatusEnum = Field(default=HealthStatusEnum.HEALTHY)
	solver_loaded: bool = Field(description='Whether CFR solver is loaded')
	model_iterations: Optional[int] = Field(
		default=None,
		ge=0,
		description='Training iterations of loaded model'
	)
