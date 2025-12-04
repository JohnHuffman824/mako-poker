"""
FastAPI server for Mako Poker ML Service.

Provides GTO solving endpoints for the Kotlin backend to call.

Usage:
    uvicorn src.api.server:app --host 0.0.0.0 --port 8081
"""

import time
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from .models import (
    SolveRequest,
    SolveResponse,
    StrategyAction,
    HealthResponse,
)
from ..enums import ActionTypeEnum, StreetEnum, HealthStatusEnum
from ..enums import Rank, Suit
from ..game.card import Card
from ..game.game_state import GameState, Street
from ..game.action import Action
from ..cfr.cfr_plus import CFRPlusSolver
from ..abstraction.hand_bucketing import HandBucketing
from ..abstraction.action_abstraction import ActionAbstraction


class SolverService:
    """Manages CFR solver instance and provides solving functionality."""

    def __init__(self):
        self.solver: Optional[CFRPlusSolver] = None
        self.hand_bucketing: Optional[HandBucketing] = None
        self.action_abstraction: Optional[ActionAbstraction] = None
        self._iterations = 0

    def initialize(
        self,
        preflop_buckets: int = 169,
        postflop_buckets: int = 20
    ) -> None:
        """Initialize solver with abstractions."""
        self.hand_bucketing = HandBucketing(
            preflop_buckets=preflop_buckets,
            postflop_buckets=postflop_buckets
        )
        self.action_abstraction = ActionAbstraction()
        self.solver = CFRPlusSolver(
            hand_bucketing=self.hand_bucketing,
            action_abstraction=self.action_abstraction
        )

    def is_loaded(self) -> bool:
        """Check if solver is initialized."""
        return self.solver is not None

    def solve(self, request: SolveRequest) -> SolveResponse:
        """Solve a poker scenario and return GTO strategy."""
        if not self.is_loaded():
            raise RuntimeError('Solver not initialized')

        start_time = time.perf_counter()

        # Get Card objects directly from request
        hole_cards = request.get_hole_cards()
        community_cards = request.get_community_cards()

        # Determine street
        street = self._determine_street(len(community_cards))

        # Get hand bucket
        board = community_cards if community_cards else None
        hand_bucket = self.hand_bucketing.get_bucket(hole_cards, board)

        # Build game state for action abstraction
        game_state = self._build_game_state(
            hole_cards=hole_cards,
            community_cards=community_cards,
            pot=request.pot,
            stack=request.stack,
            opponent_stack=request.opponent_stack,
            to_call=request.to_call,
            big_blind=request.big_blind,
            street=street
        )

        # Get abstract actions
        actions = self.action_abstraction.get_abstract_actions(game_state)

        # Build information set key and get strategy
        infoset_key = self._build_infoset_key(hand_bucket, street, game_state)
        strategy = self.solver.get_strategy(infoset_key)

        # Convert to response format
        strategy_actions = self._build_strategy_actions(actions, strategy)

        # Find recommended action
        recommended = max(strategy_actions, key=lambda x: x.probability)

        # Map internal Street to API StreetEnum
        street_enum = StreetEnum(street.name)

        solve_time = (time.perf_counter() - start_time) * 1000

        return SolveResponse(
            strategy=strategy_actions,
            recommended_action=recommended.action,
            recommended_amount=recommended.amount,
            confidence=recommended.probability,
            hand_bucket=hand_bucket,
            street=street_enum,
            solve_time_ms=round(solve_time, 2)
        )

    def _determine_street(self, num_community_cards: int) -> Street:
        """Determine betting street from community card count."""
        if num_community_cards == 0:
            return Street.PREFLOP
        elif num_community_cards == 3:
            return Street.FLOP
        elif num_community_cards == 4:
            return Street.TURN
        else:
            return Street.RIVER

    def _build_game_state(
        self,
        hole_cards: list[Card],
        community_cards: list[Card],
        pot: int,
        stack: int,
        opponent_stack: int,
        to_call: int,
        big_blind: int,
        street: Street
    ) -> GameState:
        """Build a GameState object for action abstraction."""
        # Placeholder opponent cards (we don't know them)
        opponent_hole = [
            Card(Rank.TWO, Suit.CLUBS),
            Card(Rank.THREE, Suit.CLUBS)
        ]

        return GameState(
            hole_cards=(hole_cards, opponent_hole),
            community_cards=community_cards,
            pot=pot,
            stacks=[stack, opponent_stack],
            current_player=0,
            street=street,
            action_history=[],
            bets_this_round=[0, to_call],
            is_terminal=False,
            winner=-1,
            big_blind=big_blind,
            facing_bet=to_call > 0
        )

    def _build_infoset_key(
        self,
        hand_bucket: int,
        street: Street,
        game_state: GameState
    ) -> str:
        """Build information set key for strategy lookup."""
        history = game_state.encode_history()
        return f'{hand_bucket}:{street.name}:{history}'

    def _build_strategy_actions(
        self,
        actions: list[Action],
        strategy: Optional[list[float]]
    ) -> list[StrategyAction]:
        """Convert actions and strategy to StrategyAction list."""
        if strategy is None:
            uniform_prob = 1.0 / len(actions) if actions else 0.0
            strategy = [uniform_prob] * len(actions)

        result = []
        for i, action in enumerate(actions):
            prob = strategy[i] if i < len(strategy) else 0.0
            action_enum = ActionTypeEnum(action.type.value)
            result.append(StrategyAction(
                action=action_enum,
                amount=action.amount,
                probability=round(prob, 4),
                ev=None
            ))

        return result


# Global solver service instance
solver_service = SolverService()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize solver on startup."""
    solver_service.initialize()
    yield


def create_app() -> FastAPI:
    """Factory function to create FastAPI app."""
    application = FastAPI(
        title='Mako Poker ML Service',
        description='GTO solver microservice for poker strategy computation',
        version='1.0.0',
        lifespan=lifespan
    )

    application.add_middleware(
        CORSMiddleware,
        allow_origins=['*'],
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*']
    )

    return application


app = create_app()


@app.get('/health', response_model=HealthResponse)
async def health_check() -> HealthResponse:
    """Health check endpoint for load balancers and monitoring."""
    return HealthResponse(
        status=HealthStatusEnum.HEALTHY,
        solver_loaded=solver_service.is_loaded(),
        model_iterations=solver_service._iterations
    )


@app.post('/api/solve', response_model=SolveResponse)
async def solve_scenario(request: SolveRequest) -> SolveResponse:
    """
    Solve a poker scenario and return GTO strategy.

    Cards must be structured objects: {"rank": "A", "suit": "s"}
    """
    if not solver_service.is_loaded():
        raise HTTPException(status_code=503, detail='Solver not initialized')

    try:
        return solver_service.solve(request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Solve error: {str(e)}')


@app.post('/api/train')
async def train_solver(iterations: int = 10000) -> dict:
    """
    Train the CFR solver for specified iterations.

    Note: This is a blocking operation. For production, use the CLI.
    """
    if not solver_service.is_loaded():
        raise HTTPException(status_code=503, detail='Solver not initialized')

    try:
        game_value = solver_service.solver.train(
            iterations=iterations,
            verbose=False
        )
        solver_service._iterations += iterations

        return {
            'status': 'complete',
            'iterations': iterations,
            'total_iterations': solver_service._iterations,
            'game_value': round(game_value, 6),
            'num_infosets': solver_service.solver.num_infosets
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Training error: {str(e)}')
