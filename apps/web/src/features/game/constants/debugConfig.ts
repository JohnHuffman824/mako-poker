/**
 * Debug configuration for testing UI positioning and styling.
 * 
 * TO ENABLE DEBUG MODE:
 * 1. Set DEBUG_SHOW_ALL_ELEMENTS = true
 * 2. Uncomment the debug rendering block in PokerTable.tsx
 * 
 * TO DISABLE DEBUG MODE:
 * 1. Set DEBUG_SHOW_ALL_ELEMENTS = false
 * 2. Comment out the debug rendering block in PokerTable.tsx
 * 
 * When enabled, displays:
 * - All 10 dealer buttons at each seat position
 * - All 10 bet markers with sample text
 * - All 5 community cards
 * - Pot display bubble
 * - Winner announcement bubble
 * 
 * All positions can be adjusted in positions.ts:
 * - WINNER_ANNOUNCEMENT_POSITION
 * - POT_DISPLAY_POSITION
 * - COMMUNITY_CARDS_POSITION
 * - BET_MARKER_POSITIONS
 * - DEALER_BUTTON_POSITIONS
 */
export const DEBUG_SHOW_ALL_ELEMENTS = false

/**
 * Mock data for debug mode rendering
 */
export const DEBUG_DATA = {
	// Sample community cards (all 5)
	communityCards: [
		{ rank: 'A' as any, suit: 'spades' as any, display: 'A♠' },
		{ rank: 'K' as any, suit: 'hearts' as any, display: 'K♥' },
		{ rank: 'Q' as any, suit: 'diamonds' as any, display: 'Q♦' },
		{ rank: 'J' as any, suit: 'clubs' as any, display: 'J♣' },
		{ rank: 'T' as any, suit: 'spades' as any, display: '10♠' },
	],
	
	// Sample pot size
	potSize: 12.5,
	
	// Sample bet markers for each seat
	betMarkers: [
		{ seatIndex: 0, text: 'ALL IN 25 BB' },
		{ seatIndex: 1, text: 'ALL IN 25 BB' },
		{ seatIndex: 2, text: 'ALL IN 25 BB' },
		{ seatIndex: 3, text: 'ALL IN 25 BB' },
		{ seatIndex: 4, text: 'ALL IN 25 BB' },
		{ seatIndex: 5, text: 'ALL IN 25 BB' },
		{ seatIndex: 6, text: 'ALL IN 25 BB' },
		{ seatIndex: 7, text: 'ALL IN 25 BB' },
		{ seatIndex: 8, text: 'ALL IN 25 BB' },
		{ seatIndex: 9, text: 'ALL IN 25 BB' },
	],
}

