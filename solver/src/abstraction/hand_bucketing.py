"""
Hand bucketing for game tree abstraction.

Groups similar hands into buckets to reduce the game tree size
while preserving strategic depth.
"""

from typing import Optional
import numpy as np

from ..enums import Rank, Suit
from ..game.card import Card
from ..game.hand_evaluator import HandEvaluator


class HandBucketing:
    """
    Assigns hands to buckets based on equity-based clustering.

    For preflop, uses canonical 169 starting hands.
    For postflop, uses Monte Carlo equity estimation bucketed into ranges.
    """

    def __init__(
        self,
        preflop_buckets: int = 169,
        postflop_buckets: int = 20,
        equity_samples: int = 1000
    ):
        """
        Initialize hand bucketing.

        Args:
            preflop_buckets: Number of preflop buckets (max 169)
            postflop_buckets: Number of postflop equity buckets
            equity_samples: Monte Carlo samples for equity calculation
        """
        self._preflop_buckets = min(preflop_buckets, 169)
        self._postflop_buckets = postflop_buckets
        self._equity_samples = equity_samples
        self._preflop_table = self._build_preflop_table()

    def get_bucket(
        self,
        hole_cards: list[Card],
        board: Optional[list[Card]] = None
    ) -> int:
        """
        Returns bucket ID for the given hand and board.

        Args:
            hole_cards: Player's two hole cards
            board: Community cards (empty for preflop)

        Returns:
            Bucket ID (0 to num_buckets-1)
        """
        if not board:
            return self._preflop_bucket(hole_cards)
        return self._equity_bucket(hole_cards, board)

    def _build_preflop_table(self) -> dict[str, int]:
        """
        Build lookup table for 169 canonical preflop hands.

        Hands are ordered by approximate hand strength:
        AA, KK, QQ, AKs, JJ, AQs, KQs, AJs, KJs, TT, AKo, ...
        """
        # Standard preflop hand rankings (approximate)
        hand_rankings = [
            'AA', 'KK', 'QQ', 'AKs', 'JJ', 'AQs', 'KQs', 'AJs', 'KJs', 'TT',
            'AKo', 'ATs', 'QJs', 'KTs', 'QTs', 'JTs', '99', 'AQo', 'A9s',
            'KQo', '88', 'K9s', 'T9s', 'A8s', 'Q9s', 'J9s', 'AJo', 'A5s',
            '77', 'A7s', 'KJo', 'A4s', 'A3s', 'A6s', 'QJo', '66', 'K8s',
            'T8s', 'A2s', '98s', 'J8s', 'ATo', 'Q8s', 'K7s', 'KTo', '55',
            'JTo', '87s', 'QTo', '44', '33', '22', 'K6s', '97s', 'K5s',
            '76s', 'T7s', 'K4s', 'K3s', 'K2s', 'Q7s', '86s', '65s', 'J7s',
            '54s', 'Q6s', '75s', '96s', 'Q5s', '64s', 'Q4s', 'Q3s', 'T9o',
            'T6s', 'Q2s', 'A9o', '53s', '85s', 'J6s', 'J9o', 'K9o', 'J5s',
            'Q9o', '43s', '74s', 'J4s', 'J3s', '95s', 'J2s', '63s', 'A8o',
            '52s', 'T5s', '84s', 'T4s', 'T3s', '42s', 'T2s', '98o', 'T8o',
            'A5o', 'A7o', '73s', 'A4o', '32s', '94s', '93s', 'J8o', 'A3o',
            '62s', '92s', 'K8o', 'A6o', '87o', 'Q8o', '83s', 'A2o', '82s',
            '97o', '72s', '76o', 'K7o', '65o', 'T7o', 'K6o', '86o', '54o',
            'K5o', 'J7o', '75o', 'Q7o', 'K4o', 'K3o', '96o', 'K2o', '64o',
            'Q6o', '53o', '85o', 'T6o', 'Q5o', '43o', 'Q4o', 'Q3o', '74o',
            'Q2o', 'J6o', '63o', 'J5o', '95o', '52o', 'J4o', 'J3o', '42o',
            'J2o', '84o', 'T5o', 'T4o', '32o', 'T3o', '73o', 'T2o', '62o',
            '94o', '93o', '92o', '83o', '82o', '72o'
        ]

        table = {}
        for idx, hand in enumerate(hand_rankings):
            # Map to bucket based on configured bucket count
            bucket = (idx * self._preflop_buckets) // 169
            table[hand] = bucket

        return table

    def _preflop_bucket(self, cards: list[Card]) -> int:
        """
        Get preflop bucket for two hole cards.

        Converts to canonical form (higher rank first, suited/offsuit suffix).
        """
        if len(cards) != 2:
            raise ValueError(f'Expected 2 hole cards, got {len(cards)}')

        c1, c2 = cards
        r1, r2 = c1.rank, c2.rank

        # Order by rank (higher first)
        if r1.value < r2.value:
            r1, r2 = r2, r1
            c1, c2 = c2, c1

        # Build canonical hand string
        is_suited = c1.suit == c2.suit
        is_pair = r1 == r2

        if is_pair:
            hand_str = f'{r1.symbol}{r2.symbol}'
        else:
            suffix = 's' if is_suited else 'o'
            hand_str = f'{r1.symbol}{r2.symbol}{suffix}'

        return self._preflop_table.get(hand_str, 0)

    def _equity_bucket(
        self,
        hole_cards: list[Card],
        board: list[Card]
    ) -> int:
        """
        Get postflop bucket based on Monte Carlo equity estimation.

        Runs simulations against random opponent hands to estimate equity,
        then maps to a bucket.
        """
        equity = self._calculate_equity(hole_cards, board)

        # Map equity (0-1) to bucket (0 to postflop_buckets-1)
        bucket = int(equity * self._postflop_buckets)
        return min(bucket, self._postflop_buckets - 1)

    def _calculate_equity(
        self,
        hole_cards: list[Card],
        board: list[Card]
    ) -> float:
        """
        Calculate equity via vectorized Monte Carlo simulation.

        Uses numpy for efficient batch sampling of opponent hands and runouts.
        """
        # Build list of available cards (excluding known cards)
        dead_cards = set(hole_cards) | set(board)
        available = [
            Card(rank, suit)
            for suit in Suit
            for rank in Rank
            if Card(rank, suit) not in dead_cards
        ]

        num_available = len(available)
        cards_needed = 5 - len(board)
        sample_size = 2 + cards_needed

        # Generate all random indices at once using numpy
        # Each row is one simulation: [opp1, opp2, runout1, runout2, ...]
        rng = np.random.default_rng()
        all_indices = np.array([
            rng.choice(num_available, size=sample_size, replace=False)
            for _ in range(self._equity_samples)
        ])

        # Track results
        wins = 0
        ties = 0

        for indices in all_indices:
            # Extract sampled cards
            opp_cards = [available[indices[0]], available[indices[1]]]
            runout = [available[idx] for idx in indices[2:]]
            full_board = board + runout

            # Evaluate hands
            my_rank = HandEvaluator.evaluate(hole_cards, full_board).absolute_rank
            opp_rank = HandEvaluator.evaluate(opp_cards, full_board).absolute_rank

            if my_rank > opp_rank:
                wins += 1
            elif my_rank == opp_rank:
                ties += 1

        return (wins + ties * 0.5) / self._equity_samples

    @property
    def num_preflop_buckets(self) -> int:
        """Number of preflop buckets."""
        return self._preflop_buckets

    @property
    def num_postflop_buckets(self) -> int:
        """Number of postflop buckets."""
        return self._postflop_buckets

