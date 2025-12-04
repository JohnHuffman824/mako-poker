import type { Card, HandStrength, PokerPosition, PokerAction } from '@shared/schema';

// Card utilities
export const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A'];
export const SUITS = ['♠', '♥', '♦', '♣'];
export const SUIT_SYMBOLS = { 's': '♠', 'h': '♥', 'd': '♦', 'c': '♣' };
export const SUIT_COLORS = { '♠': 'black', '♥': 'red', '♦': 'red', '♣': 'black' };

export function parseCard(cardString: string): Card {
  if (cardString.length !== 2) throw new Error('Invalid card format');
  
  const rank = cardString[0];
  const suitChar = cardString[1].toLowerCase();
  const suit = SUIT_SYMBOLS[suitChar as keyof typeof SUIT_SYMBOLS];
  
  if (!RANKS.includes(rank) || !suit) {
    throw new Error('Invalid card');
  }
  
  return {
    rank,
    suit,
    display: rank + suit
  };
}

export function cardToString(card: Card): string {
  const suitMap = { '♠': 's', '♥': 'h', '♦': 'd', '♣': 'c' };
  return card.rank + suitMap[card.suit as keyof typeof suitMap];
}

export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const rank of RANKS) {
    for (const suit of SUITS) {
      deck.push({ rank, suit, display: rank + suit });
    }
  }
  return deck;
}

export function getAvailableCards(usedCards: Card[]): Card[] {
  const deck = createDeck();
  const usedCardStrings = usedCards.map(cardToString);
  return deck.filter(card => !usedCardStrings.includes(cardToString(card)));
}

// Hand evaluation
export function getRankValue(rank: string): number {
  return RANKS.indexOf(rank);
}

export function evaluateHand(holeCards: Card[], communityCards: Card[]): HandStrength {
  const allCards = [...holeCards, ...communityCards];
  
  if (allCards.length < 2) {
    return {
      rank: 'High Card',
      description: 'No hand formed',
      strength: 0,
      category: 'weak'
    };
  }

  // Simple hand evaluation - in a real app you'd use a proper hand evaluator
  const ranks = allCards.map(card => card.rank);
  const suits = allCards.map(card => card.suit);
  
  // Check for pairs
  const rankCounts = ranks.reduce((acc, rank) => {
    acc[rank] = (acc[rank] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const pairs = Object.entries(rankCounts).filter(([_, count]) => count >= 2);
  const trips = Object.entries(rankCounts).filter(([_, count]) => count >= 3);
  const quads = Object.entries(rankCounts).filter(([_, count]) => count >= 4);
  
  // Check for flush
  const suitCounts = suits.reduce((acc, suit) => {
    acc[suit] = (acc[suit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const isFlush = Object.values(suitCounts).some(count => count >= 5);
  
  // Determine hand strength
  if (quads.length > 0) {
    return {
      rank: 'Four of a Kind',
      description: `Quad ${quads[0][0]}s`,
      strength: 0.95,
      category: 'monster'
    };
  } else if (trips.length > 0 && pairs.length > 1) {
    return {
      rank: 'Full House',
      description: `${trips[0][0]}s full of ${pairs.find(([rank]) => rank !== trips[0][0])?.[0] || ''}s`,
      strength: 0.9,
      category: 'very-strong'
    };
  } else if (isFlush) {
    return {
      rank: 'Flush',
      description: 'Flush',
      strength: 0.8,
      category: 'strong'
    };
  } else if (trips.length > 0) {
    return {
      rank: 'Three of a Kind',
      description: `Trip ${trips[0][0]}s`,
      strength: 0.7,
      category: 'strong'
    };
  } else if (pairs.length >= 2) {
    const pairRanks = pairs.map(([rank]) => rank).sort((a, b) => getRankValue(b) - getRankValue(a));
    return {
      rank: 'Two Pair',
      description: `${pairRanks[0]}s and ${pairRanks[1]}s`,
      strength: 0.6,
      category: 'medium'
    };
  } else if (pairs.length === 1) {
    const pairRank = pairs[0][0];
    const kicker = ranks.filter(r => r !== pairRank).sort((a, b) => getRankValue(b) - getRankValue(a))[0];
    return {
      rank: 'One Pair',
      description: `Pair of ${pairRank}s, ${kicker} kicker`,
      strength: 0.4,
      category: 'medium'
    };
  } else {
    const highCard = ranks.sort((a, b) => getRankValue(b) - getRankValue(a))[0];
    return {
      rank: 'High Card',
      description: `${highCard} high`,
      strength: 0.2,
      category: 'weak'
    };
  }
}

// Position utilities
export function getPositionValue(position: PokerPosition): number {
  const positionOrder: PokerPosition[] = ['UTG', 'UTG+1', 'MP', 'MP+1', 'CO', 'BTN', 'SB', 'BB'];
  return positionOrder.indexOf(position);
}

export function isEarlyPosition(position: PokerPosition): boolean {
  return ['UTG', 'UTG+1', 'MP'].includes(position);
}

export function isLatePosition(position: PokerPosition): boolean {
  return ['CO', 'BTN'].includes(position);
}

// Basic range estimation
export function estimateOpponentRange(position: PokerPosition, action: PokerAction, playerCount: number): string[] {
  // Simplified range estimation - in a real app this would be much more sophisticated
  const tightRanges = {
    UTG: ['AA', 'KK', 'QQ', 'JJ', 'AKs', 'AKo'],
    'UTG+1': ['AA', 'KK', 'QQ', 'JJ', 'TT', 'AKs', 'AKo', 'AQs'],
    MP: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo'],
    'MP+1': ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs'],
    CO: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'KQs'],
    BTN: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo', 'ATs', 'KQs', 'KQo', 'KJs'],
    SB: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', 'AKs', 'AKo', 'AQs', 'AQo'],
    BB: ['AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', 'AKs', 'AKo', 'AQs', 'AQo', 'AJs', 'AJo']
  };
  
  return tightRanges[position] || tightRanges.UTG;
}

// Pot odds calculation
export function calculatePotOdds(potSize: number, betSize: number): string {
  const totalPot = potSize + betSize;
  const odds = totalPot / betSize;
  return `${odds.toFixed(1)}:1`;
}

// Expected value calculation
export function calculateExpectedValue(
  equity: number,
  potSize: number,
  betSize: number,
  foldEquity: number = 0
): number {
  const callEV = equity * (potSize + betSize) - betSize;
  const foldEV = foldEquity * potSize;
  return Math.max(callEV, foldEV, 0); // Simplified EV calculation
}

// Outs calculation
export function calculateOuts(holeCards: Card[], communityCards: Card[]): { count: number; description: string } {
  // Simplified outs calculation
  const playerCards = holeCards.map(cardToString);
  const boardCards = communityCards.map(cardToString);
  
  // Check for flush draws
  const suits = [...holeCards, ...communityCards].map(card => card.suit);
  const suitCounts = suits.reduce((acc, suit) => {
    acc[suit] = (acc[suit] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const flushSuit = Object.entries(suitCounts).find(([_, count]) => count === 4)?.[0];
  
  if (flushSuit) {
    return {
      count: 9,
      description: `9 outs (any ${flushSuit} for flush)`
    };
  }
  
  // Check for straight draws
  const ranks = [...holeCards, ...communityCards].map(card => card.rank);
  const uniqueRanks = Array.from(new Set(ranks));
  
  if (uniqueRanks.length >= 4) {
    return {
      count: 8,
      description: '8 outs (straight draw)'
    };
  }
  
  // Check for pair draws
  const holePairs = holeCards[0].rank === holeCards[1].rank;
  if (!holePairs) {
    return {
      count: 6,
      description: '6 outs (two pair or trips)'
    };
  }
  
  return {
    count: 2,
    description: '2 outs (trips)'
  };
}
