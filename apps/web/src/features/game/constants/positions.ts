/**
 * Fixed 10-seat positions around the poker table.
 * All seats are always rendered - empty seats show add button.
 * Hero is always at seat 0 (bottom center).
 * 
 * COORDINATE SYSTEM:
 * - Design viewport: 1440×900 pixels
 * - Origin (0,0) is top-left corner
 * - X-axis (left): 0 = left edge, 1440 = right edge
 * - Y-axis (top): 0 = top edge, 900 = bottom edge
 * - Bottom bar: 144px tall (excluded from table centering)
 * - Available vertical space: 756px (900 - 144)
 * - Table center: (720, 378) - centered in space above bottom bar
 * 
 * The ScaledContainer handles scaling for different screen sizes.
 * 
 * ADJUSTING POSITIONS:
 * 1. Seat positions (ALL_SEAT_POSITIONS): Where players sit
 * 2. Button positions (DEALER_BUTTON_POSITIONS): Where button appears per seat
 * 
 * Both arrays must have matching indices (position [3] = seat 3's position/button)
 */

// Design viewport dimensions
const DESIGN_WIDTH = 1440
const DESIGN_HEIGHT = 900
const BOTTOM_BAR_HEIGHT = 144

export interface SeatPosition {
	top: number
	left: number
}

/**
 * All 10 seat positions in pixels, arranged CLOCKWISE from hero.
 * Seat 0 is always the hero position at bottom center.
 * Clockwise from player's perspective = left around the table.
 * 
 * To adjust positions manually, modify the top/left values:
 * - Increase top = move down, decrease top = move up
 * - Increase left = move right, decrease left = move left
 */
export const ALL_SEAT_POSITIONS: SeatPosition[] = [
	{ top: 628, left: 720 },   // 0: Hero (bottom center)
	{ top: 628, left: 460 },   // 1: Bottom-left
	{ top: 468, left: 282 },   // 2: Left-bottom
	{ top: 268, left: 282 },   // 3: Left-top
	{ top: 135, left: 460 },   // 4: Top-left
	{ top: 135, left: 720 },   // 5: Top-center
	{ top: 135, left: 980 },   // 6: Top-right
	{ top: 268, left: 1158 },  // 7: Right-top
	{ top: 468, left: 1158 },  // 8: Right-bottom
	{ top: 628, left: 980 },   // 9: Bottom-right
]

export const TOTAL_SEATS = ALL_SEAT_POSITIONS.length
export const HERO_SEAT_INDEX = 0

/**
 * Table center position in design pixels.
 * Centered in the available space excluding the bottom bar (144px).
 */
export const TABLE_CENTER = {
	top: (DESIGN_HEIGHT - BOTTOM_BAR_HEIGHT) / 2,
	left: DESIGN_WIDTH / 2,
}

/**
 * Fixed dealer button positions for each seat.
 * Each position corresponds to the seat index in ALL_SEAT_POSITIONS.
 * Button is placed between the player and table center, on the felt.
 * 
 * To adjust manually, modify the top/left values:
 * - Position should be visible on the table between player and center
 * - Button should be closer to player than to center
 * - Typical offset: 35-45% from player toward center
 */
export const DEALER_BUTTON_POSITIONS: SeatPosition[] = [
	{ top: 494, left: 720 },   // 0: Hero button position
	{ top: 494, left: 520 },   // 1: Bottom-left button
	{ top: 438, left: 410 },   // 2: Left-bottom button
	{ top: 318, left: 410 },   // 3: Left-top button
	{ top: 262, left: 520 },   // 4: Top-left button
	{ top: 262, left: 720 },   // 5: Top-center button
	{ top: 262, left: 920 },   // 6: Top-right button
	{ top: 318, left: 1032 },  // 7: Right-top button
	{ top: 438, left: 1032 },  // 8: Right-bottom button
	{ top: 494, left: 920 },   // 9: Bottom-right button
]

/**
 * Gets the dealer button position for a given seat index.
 * Uses pre-defined positions for accuracy and easy manual adjustment.
 */
export function getDealerButtonPosition(dealerSeatIndex: number): {
	top: number
	left: number
} {
	if (dealerSeatIndex < 0 || dealerSeatIndex >= DEALER_BUTTON_POSITIONS.length) {
		console.warn(`Invalid dealer seat index: ${dealerSeatIndex}`)
		return TABLE_CENTER
	}
	
	return DEALER_BUTTON_POSITIONS[dealerSeatIndex]
}

/**
 * Fixed bet marker positions for each seat.
 * Positioned 5px closer to table center than previous positions
 * to avoid overlap with dealer button.
 */
export const BET_MARKER_POSITIONS: SeatPosition[] = [
	{ top: 465, left: 720 },   // 0: Hero - moved up 5px
	{ top: 465, left: 555 },   // 1: Bottom-left - moved up 5px, right 5px
	{ top: 418, left: 470 },   // 2: Left-bottom - moved up 5px, right 5px
	{ top: 337, left: 470 },   // 3: Left-top - moved down 5px, right 5px
	{ top: 293, left: 555 },   // 4: Top-left - moved down 5px, right 5px
	{ top: 293, left: 720 },   // 5: Top-center - moved down 5px
	{ top: 293, left: 885 },   // 6: Top-right - moved down 5px, left 5px
	{ top: 335, left: 970 },   // 7: Right-top - moved down 5px, left 5px
	{ top: 420, left: 970 },   // 8: Right-bottom - moved up 5px, left 5px
	{ top: 465, left: 885 },   // 9: Bottom-right - moved up 5px, left 5px
]

/**
 * Gets the bet marker position for a given seat index.
 */
export function getBetMarkerPosition(seatIndex: number): {
	top: number
	left: number
} {
	if (seatIndex < 0 || seatIndex >= BET_MARKER_POSITIONS.length) {
		return TABLE_CENTER
	}
	
	return BET_MARKER_POSITIONS[seatIndex]
}

/**
 * Position for community cards display.
 * Centered horizontally, positioned to avoid bet markers.
 */
export const COMMUNITY_CARDS_POSITION = {
	top: 395,
	left: 720,
}

/**
 * Position for pot display bubble.
 * Above community cards, centered horizontally.
 */
export const POT_DISPLAY_POSITION = {
	top: 330,
	left: 720,
}

/**
 * Position for winner announcement bubble (showdown results).
 * Displays "You win!" or "Seat X wins!" with hand description.
 */
export const WINNER_ANNOUNCEMENT_POSITION = {
	top: 330,
	left: 720,
}

/**
 * Position for hero's stack bubble display.
 * Positioned below hero cards at bottom center.
 */
export const HERO_STACK_POSITION = {
	top: 720,
	left: 720,
}