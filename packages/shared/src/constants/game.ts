/**
 * Position assignments for different table sizes.
 */
export const POSITION_NAMES: Record<number, string[]> = {
	2: ['BTN', 'BB'],
	3: ['BTN', 'SB', 'BB'],
	4: ['BTN', 'SB', 'BB', 'UTG'],
	5: ['BTN', 'SB', 'BB', 'UTG', 'CO'],
	6: ['BTN', 'SB', 'BB', 'UTG', 'MP', 'CO'],
	7: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'CO'],
	8: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'MP', 'HJ', 'CO'],
	9: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'HJ', 'CO'],
	10: ['BTN', 'SB', 'BB', 'UTG', 'UTG+1', 'UTG+2', 'MP', 'MP+1', 'HJ', 'CO']
}
