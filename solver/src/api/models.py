"""
Pydantic models for API request/response validation.
"""

from typing import Optional
from pydantic import BaseModel, Field, field_validator


class StrategyAction(BaseModel):
    """Represents a single action in the recommended strategy."""
    action: str = Field(description='Action type: fold, check, call, bet, raise')
    amount: int = Field(default=0, description='Bet/raise amount (0 for fold/check/call)')
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
    hole_cards: list[str] = Field(
        min_length=2, max_length=2,
        description='Player hole cards in notation format (e.g., ["As", "Kh"])'
    )
    community_cards: list[str] = Field(
        default=[],
        max_length=5,
        description='Community cards (0-5 cards depending on street)'
    )
    pot: int = Field(gt=0, description='Current pot size')
    stack: int = Field(gt=0, description='Player remaining stack')
    opponent_stack: int = Field(gt=0, description='Opponent remaining stack')
    position: str = Field(
        default='BTN',
        description='Player position (BTN, SB, BB, etc.)'
    )
    to_call: int = Field(
        default=0, ge=0,
        description='Amount needed to call (0 if not facing bet)'
    )
    big_blind: int = Field(default=2, gt=0, description='Big blind size')

    @field_validator('hole_cards', 'community_cards', mode='before')
    @classmethod
    def validate_card_notation(cls, cards: list[str]) -> list[str]:
        """Validate card notation format."""
        valid_ranks = set('23456789TJQKA')
        valid_suits = set('shdc')

        for card in cards:
            if len(card) != 2:
                raise ValueError(f'Invalid card notation: {card}')
            if card[0].upper() not in valid_ranks:
                raise ValueError(f'Invalid rank in card: {card}')
            if card[1].lower() not in valid_suits:
                raise ValueError(f'Invalid suit in card: {card}')

        return [c[0].upper() + c[1].lower() for c in cards]


class SolveResponse(BaseModel):
    """Response containing GTO strategy for the scenario."""
    strategy: list[StrategyAction] = Field(
        description='List of actions with probabilities'
    )
    recommended_action: str = Field(
        description='Single recommended action (highest probability)'
    )
    recommended_amount: int = Field(
        default=0,
        description='Amount for recommended action'
    )
    confidence: float = Field(
        ge=0.0, le=1.0,
        description='Confidence in the recommendation'
    )
    hand_bucket: int = Field(description='Hand strength bucket used')
    street: str = Field(description='Current betting street')
    solve_time_ms: float = Field(description='Time taken to solve in milliseconds')


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = Field(default='healthy')
    solver_loaded: bool = Field(description='Whether CFR solver is loaded')
    model_iterations: Optional[int] = Field(
        default=None,
        description='Training iterations of loaded model'
    )

