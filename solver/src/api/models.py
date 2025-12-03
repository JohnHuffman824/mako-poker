"""
Pydantic models for API request/response validation.

Uses structured types (enums) from the centralized enums package.
"""

from typing import Optional
from pydantic import BaseModel, Field, field_validator, model_validator

from ..enums import (
    RankEnum,
    SuitEnum,
    ActionTypeEnum,
    PositionEnum,
    StreetEnum,
    HealthStatusEnum,
)


class CardModel(BaseModel):
    """
    Structured card representation.

    Can be created from notation string or rank/suit enums.
    """
    rank: RankEnum
    suit: SuitEnum

    @property
    def notation(self) -> str:
        """Short notation (e.g., 'As' for Ace of Spades)."""
        return f'{self.rank.value}{self.suit.value}'

    def __str__(self) -> str:
        return self.notation

    @classmethod
    def from_notation(cls, notation: str) -> 'CardModel':
        """
        Parse card from notation string (e.g., 'As', 'Th').

        Args:
            notation: Two-character string: rank + suit

        Returns:
            CardModel instance

        Raises:
            ValueError: if notation is invalid
        """
        if len(notation) != 2:
            raise ValueError(f'Card notation must be 2 characters: {notation}')

        rank = RankEnum.from_symbol(notation[0])
        suit = SuitEnum.from_symbol(notation[1])

        return cls(rank=rank, suit=suit)

    class Config:
        json_encoders = {
            'CardModel': lambda c: c.notation
        }


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
    """Request to solve a poker scenario for GTO strategy."""
    hole_cards: list[CardModel] = Field(
        min_length=2, max_length=2,
        description='Player hole cards'
    )
    community_cards: list[CardModel] = Field(
        default=[],
        max_length=5,
        description='Community cards (0-5 cards depending on street)'
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

    @field_validator('hole_cards', 'community_cards', mode='before')
    @classmethod
    def parse_cards(cls, cards):
        """
        Parse cards from various input formats.

        Accepts:
        - List of CardModel objects
        - List of notation strings (e.g., ['As', 'Kh'])
        - List of dicts with rank/suit keys
        """
        if not cards:
            return []

        result = []
        for card in cards:
            if isinstance(card, CardModel):
                result.append(card)
            elif isinstance(card, str):
                result.append(CardModel.from_notation(card))
            elif isinstance(card, dict):
                result.append(CardModel(**card))
            else:
                raise ValueError(f'Invalid card format: {card}')

        return result

    @model_validator(mode='after')
    def validate_no_duplicate_cards(self):
        """Ensure no duplicate cards in hole + community."""
        all_cards = self.hole_cards + self.community_cards
        notations = [c.notation for c in all_cards]
        if len(notations) != len(set(notations)):
            raise ValueError('Duplicate cards detected')
        return self


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
