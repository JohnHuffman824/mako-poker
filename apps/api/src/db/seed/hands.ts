/**
 * All 169 starting hand combos: 13 pairs + 78 suited + 78 offsuit.
 */
export const ALL_HANDS = generateAllHands()

function generateAllHands(): string[] {
	const ranks = [
		'A', 'K', 'Q', 'J', 'T',
		'9', '8', '7', '6', '5', '4', '3', '2',
	]
	const hands: string[] = []
	for (let i = 0; i < ranks.length; i++) {
		hands.push(ranks[i] + ranks[i])
		for (let j = i + 1; j < ranks.length; j++) {
			hands.push(ranks[i] + ranks[j] + 's')
			hands.push(ranks[i] + ranks[j] + 'o')
		}
	}
	return hands
}
