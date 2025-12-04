import type { Card, HandStrength } from '@shared/schema';
import { createDeck, cardToString, evaluateHand, getAvailableCards } from './poker-logic';

export interface MonteCarloResult {
	equity: number;
	wins: number;
	ties: number;
	simulations: number;
	calculationTime: number;
}

export interface SimulationConfig {
	holeCards: Card[];
	communityCards: Card[];
	opponentCount: number;
	simulations: number;
}

export function runMonteCarloSimulation(config: SimulationConfig): MonteCarloResult {
	const startTime = Date.now();
	const { holeCards, communityCards, opponentCount, simulations } = config;
	
	let wins = 0;
	let ties = 0;
	
	// Get available cards for simulation
	const usedCards = [...holeCards, ...communityCards];
	const availableCards = getAvailableCards(usedCards);
	
	for (let i = 0; i < simulations; i++) {
		const result = simulateHand(holeCards, communityCards, availableCards, opponentCount);
		if (result === 'win') wins++;
		else if (result === 'tie') ties++;
	}
	
	const equity = (wins + ties * 0.5) / simulations;
	const calculationTime = Date.now() - startTime;
	
	return {
		equity,
		wins,
		ties,
		simulations,
		calculationTime
	};
}

function simulateHand(
	holeCards: Card[],
	communityCards: Card[],
	availableCards: Card[],
	opponentCount: number
): 'win' | 'tie' | 'loss' {
	// Shuffle available cards
	const shuffled = [...availableCards];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	
	let cardIndex = 0;
	
	// Deal remaining community cards if needed
	const finalCommunityCards = [...communityCards];
	while (finalCommunityCards.length < 5) {
		finalCommunityCards.push(shuffled[cardIndex++]);
	}
	
	// Deal opponent hole cards
	const opponents: Card[][] = [];
	for (let i = 0; i < opponentCount; i++) {
		opponents.push([shuffled[cardIndex++], shuffled[cardIndex++]]);
	}
	
	// Evaluate all hands
	const playerHand = evaluateHand(holeCards, finalCommunityCards);
	const opponentHands = opponents.map(oppCards => evaluateHand(oppCards, finalCommunityCards));
	
	// Compare hands (simplified comparison by strength)
	const playerStrength = playerHand.strength;
	let betterHands = 0;
	let equalHands = 0;
	
	for (const oppHand of opponentHands) {
		if (oppHand.strength > playerStrength) {
			betterHands++;
		} else if (Math.abs(oppHand.strength - playerStrength) < 0.001) {
			equalHands++;
		}
	}
	
	if (betterHands > 0) return 'loss';
	if (equalHands > 0) return 'tie';
	return 'win';
}


