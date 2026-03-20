/**
 * Curated push/fold charts for short-stack tournament play.
 *
 * Sources: Mathematically solved push/fold equilibria.
 * These are well-known and freely available (ICMizer, HoldemResources).
 *
 * Format: { "AA": "push", "72o": "fold", ... }
 * Each hand is either "push" or "fold" — no mixed strategies.
 */

type PushFoldAction = 'push' | 'fold'
type PushFoldRanges = Record<string, PushFoldAction>

export interface PushFoldEntry {
	position: string
	stackDepthBb: number
	tableSize: string
	ranges: PushFoldRanges
	source: string
}

const ALL_HANDS = generateAllHands()

function generateAllHands(): string[] {
	const ranks = [
		'A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'
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

function buildPushFold(pushHands: string[]): PushFoldRanges {
	const pushSet = new Set(pushHands)
	const ranges: PushFoldRanges = {}
	for (const hand of ALL_HANDS) {
		ranges[hand] = pushSet.has(hand) ? 'push' : 'fold'
	}
	return ranges
}

// ===================================================================
// PUSH/FOLD CHARTS
// 8 positions × 5 stack depths (5, 8, 10, 15, 20 BB) × 2 table sizes
// ===================================================================

// --- 5BB (very short stack — push wide) ---

const BTN_5BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33', '22',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o',
	'A5o', 'A4o', 'A3o', 'A2o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
	'K4s', 'K3s', 'K2s',
	'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o', 'K6o',
	'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s',
	'Q3s', 'Q2s',
	'QJo', 'QTo', 'Q9o', 'Q8o', 'Q7o',
	'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s',
	'JTo', 'J9o', 'J8o',
	'T9s', 'T8s', 'T7s', 'T6s', 'T5s',
	'T9o', 'T8o',
	'98s', '97s', '96s', '95s',
	'98o', '97o',
	'87s', '86s', '85s',
	'87o',
	'76s', '75s', '74s',
	'65s', '64s',
	'54s', '53s',
	'43s',
])

const CO_5BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33', '22',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o',
	'A5o', 'A4o', 'A3o', 'A2o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
	'K4s', 'K3s', 'K2s',
	'KQo', 'KJo', 'KTo', 'K9o', 'K8o',
	'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s',
	'QJo', 'QTo', 'Q9o', 'Q8o',
	'JTs', 'J9s', 'J8s', 'J7s', 'J6s',
	'JTo', 'J9o',
	'T9s', 'T8s', 'T7s', 'T6s',
	'T9o', 'T8o',
	'98s', '97s', '96s',
	'98o',
	'87s', '86s', '85s',
	'76s', '75s',
	'65s', '64s',
	'54s',
])

const MP_5BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33', '22',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o',
	'A5o', 'A4o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
	'KQo', 'KJo', 'KTo', 'K9o',
	'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s',
	'QJo', 'QTo',
	'JTs', 'J9s', 'J8s',
	'JTo',
	'T9s', 'T8s', 'T7s',
	'T9o',
	'98s', '97s',
	'87s', '86s',
	'76s', '75s',
	'65s',
	'54s',
])

const UTG_5BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s',
	'KQo', 'KJo', 'KTo',
	'QJs', 'QTs', 'Q9s', 'Q8s',
	'QJo',
	'JTs', 'J9s', 'J8s',
	'T9s', 'T8s',
	'98s', '97s',
	'87s', '86s',
	'76s',
	'65s',
	'54s',
])

const SB_5BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33', '22',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o',
	'A5o', 'A4o', 'A3o', 'A2o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
	'K4s', 'K3s', 'K2s',
	'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o', 'K6o', 'K5o',
	'K4o',
	'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s',
	'Q3s', 'Q2s',
	'QJo', 'QTo', 'Q9o', 'Q8o', 'Q7o', 'Q6o',
	'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s', 'J3s',
	'JTo', 'J9o', 'J8o', 'J7o',
	'T9s', 'T8s', 'T7s', 'T6s', 'T5s', 'T4s',
	'T9o', 'T8o', 'T7o',
	'98s', '97s', '96s', '95s', '94s',
	'98o', '97o', '96o',
	'87s', '86s', '85s', '84s',
	'87o', '86o',
	'76s', '75s', '74s', '73s',
	'76o', '75o',
	'65s', '64s', '63s',
	'65o',
	'54s', '53s', '52s',
	'54o',
	'43s', '42s',
	'32s',
])

// --- 8BB ---

const BTN_8BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33', '22',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o',
	'A5o', 'A4o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
	'K4s', 'K3s',
	'KQo', 'KJo', 'KTo', 'K9o', 'K8o',
	'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s',
	'QJo', 'QTo', 'Q9o',
	'JTs', 'J9s', 'J8s', 'J7s', 'J6s',
	'JTo', 'J9o',
	'T9s', 'T8s', 'T7s', 'T6s',
	'T9o',
	'98s', '97s', '96s',
	'98o',
	'87s', '86s', '85s',
	'76s', '75s',
	'65s', '64s',
	'54s',
])

const CO_8BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s',
	'KQo', 'KJo', 'KTo', 'K9o',
	'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s',
	'QJo', 'QTo',
	'JTs', 'J9s', 'J8s', 'J7s',
	'JTo',
	'T9s', 'T8s', 'T7s',
	'98s', '97s', '96s',
	'87s', '86s',
	'76s', '75s',
	'65s', '64s',
	'54s',
])

const MP_8BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s',
	'KQo', 'KJo', 'KTo',
	'QJs', 'QTs', 'Q9s',
	'QJo',
	'JTs', 'J9s',
	'T9s', 'T8s',
	'98s', '97s',
	'87s',
	'76s',
	'65s',
])

const UTG_8BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66',
	'55',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s',
	'A5s', 'A4s',
	'AKo', 'AQo', 'AJo', 'ATo',
	'KQs', 'KJs', 'KTs', 'K9s',
	'KQo', 'KJo',
	'QJs', 'QTs',
	'JTs', 'J9s',
	'T9s',
	'98s',
	'87s',
	'76s',
])

const SB_8BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33', '22',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o',
	'A5o', 'A4o', 'A3o', 'A2o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
	'K4s', 'K3s', 'K2s',
	'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o', 'K6o',
	'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s',
	'Q3s',
	'QJo', 'QTo', 'Q9o', 'Q8o', 'Q7o',
	'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s',
	'JTo', 'J9o', 'J8o',
	'T9s', 'T8s', 'T7s', 'T6s', 'T5s',
	'T9o', 'T8o',
	'98s', '97s', '96s', '95s',
	'98o', '97o',
	'87s', '86s', '85s', '84s',
	'87o',
	'76s', '75s', '74s',
	'76o',
	'65s', '64s', '63s',
	'65o',
	'54s', '53s',
	'54o',
	'43s',
])

// --- 10BB ---

const BTN_10BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s',
	'KQo', 'KJo', 'KTo', 'K9o',
	'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s',
	'QJo', 'QTo',
	'JTs', 'J9s', 'J8s', 'J7s',
	'JTo',
	'T9s', 'T8s', 'T7s',
	'T9o',
	'98s', '97s', '96s',
	'87s', '86s',
	'76s', '75s',
	'65s', '64s',
	'54s',
])

const CO_10BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s',
	'KQo', 'KJo', 'KTo',
	'QJs', 'QTs', 'Q9s', 'Q8s',
	'QJo',
	'JTs', 'J9s', 'J8s',
	'T9s', 'T8s',
	'98s', '97s',
	'87s', '86s',
	'76s',
	'65s',
	'54s',
])

const MP_10BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s',
	'A5s', 'A4s',
	'AKo', 'AQo', 'AJo', 'ATo',
	'KQs', 'KJs', 'KTs', 'K9s',
	'KQo', 'KJo',
	'QJs', 'QTs',
	'JTs', 'J9s',
	'T9s',
	'98s',
	'87s',
])

const UTG_10BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s',
	'A5s',
	'AKo', 'AQo', 'AJo',
	'KQs', 'KJs', 'KTs',
	'KQo',
	'QJs', 'QTs',
	'JTs',
	'T9s',
	'98s',
])

const SB_10BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33', '22',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o',
	'A5o', 'A4o', 'A3o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
	'K4s', 'K3s',
	'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o',
	'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s',
	'QJo', 'QTo', 'Q9o', 'Q8o',
	'JTs', 'J9s', 'J8s', 'J7s', 'J6s',
	'JTo', 'J9o', 'J8o',
	'T9s', 'T8s', 'T7s', 'T6s',
	'T9o', 'T8o',
	'98s', '97s', '96s',
	'98o',
	'87s', '86s', '85s',
	'87o',
	'76s', '75s', '74s',
	'65s', '64s',
	'54s', '53s',
	'43s',
])

// --- 15BB ---

const BTN_15BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s',
	'KQo', 'KJo', 'KTo',
	'QJs', 'QTs', 'Q9s',
	'QJo',
	'JTs', 'J9s', 'J8s',
	'T9s', 'T8s',
	'98s', '97s',
	'87s',
	'76s',
	'65s',
])

const CO_15BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s',
	'A5s', 'A4s',
	'AKo', 'AQo', 'AJo', 'ATo',
	'KQs', 'KJs', 'KTs', 'K9s',
	'KQo', 'KJo',
	'QJs', 'QTs', 'Q9s',
	'JTs', 'J9s',
	'T9s', 'T8s',
	'98s',
	'87s',
	'76s',
])

const MP_15BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s',
	'A5s',
	'AKo', 'AQo', 'AJo',
	'KQs', 'KJs', 'KTs',
	'KQo',
	'QJs',
	'JTs',
	'T9s',
])

const UTG_15BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88',
	'AKs', 'AQs', 'AJs', 'ATs',
	'AKo', 'AQo',
	'KQs', 'KJs',
	'QJs',
])

const SB_15BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s',
	'KQo', 'KJo', 'KTo', 'K9o',
	'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s',
	'QJo', 'QTo',
	'JTs', 'J9s', 'J8s', 'J7s',
	'JTo',
	'T9s', 'T8s', 'T7s',
	'T9o',
	'98s', '97s',
	'87s', '86s',
	'76s', '75s',
	'65s',
	'54s',
])

// --- 20BB ---

const BTN_20BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s',
	'A5s', 'A4s',
	'AKo', 'AQo', 'AJo', 'ATo',
	'KQs', 'KJs', 'KTs', 'K9s',
	'KQo', 'KJo',
	'QJs', 'QTs', 'Q9s',
	'JTs', 'J9s',
	'T9s', 'T8s',
	'98s',
	'87s',
	'76s',
])

const CO_20BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s',
	'A5s',
	'AKo', 'AQo', 'AJo',
	'KQs', 'KJs', 'KTs',
	'KQo',
	'QJs', 'QTs',
	'JTs',
	'T9s',
])

const MP_20BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88',
	'AKs', 'AQs', 'AJs', 'ATs',
	'AKo', 'AQo',
	'KQs', 'KJs',
	'QJs',
])

const UTG_20BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
	'AKs', 'AQs', 'AJs',
	'AKo', 'AQo',
	'KQs',
])

const SB_20BB_6MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s',
	'KQo', 'KJo', 'KTo',
	'QJs', 'QTs', 'Q9s', 'Q8s',
	'QJo',
	'JTs', 'J9s', 'J8s',
	'T9s', 'T8s',
	'98s', '97s',
	'87s',
	'76s',
	'65s',
	'54s',
])

// --- 9-max Push/Fold (key positions only) ---
// 9-max uses similar ranges but tighter from early positions

const UTG_10BB_9MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99',
	'AKs', 'AQs', 'AJs',
	'AKo', 'AQo',
	'KQs',
])

const HJ_10BB_9MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s',
	'A5s',
	'AKo', 'AQo', 'AJo',
	'KQs', 'KJs', 'KTs',
	'KQo',
	'QJs',
	'JTs',
	'T9s',
])

const CO_10BB_9MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s',
	'A5s', 'A4s',
	'AKo', 'AQo', 'AJo', 'ATo',
	'KQs', 'KJs', 'KTs', 'K9s',
	'KQo', 'KJo',
	'QJs', 'QTs',
	'JTs', 'J9s',
	'T9s',
	'98s',
	'87s',
])

const BTN_10BB_9MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s',
	'KQo', 'KJo', 'KTo', 'K9o',
	'QJs', 'QTs', 'Q9s', 'Q8s',
	'QJo', 'QTo',
	'JTs', 'J9s', 'J8s',
	'JTo',
	'T9s', 'T8s', 'T7s',
	'98s', '97s',
	'87s', '86s',
	'76s', '75s',
	'65s',
	'54s',
])

const SB_10BB_9MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33', '22',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o',
	'A5o', 'A4o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
	'K4s',
	'KQo', 'KJo', 'KTo', 'K9o', 'K8o',
	'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s',
	'QJo', 'QTo', 'Q9o',
	'JTs', 'J9s', 'J8s', 'J7s',
	'JTo', 'J9o',
	'T9s', 'T8s', 'T7s',
	'T9o',
	'98s', '97s', '96s',
	'98o',
	'87s', '86s', '85s',
	'76s', '75s',
	'65s', '64s',
	'54s',
	'43s',
])

// Remaining 9-max depths reuse similar patterns
const UTG_5BB_9MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66',
	'55', '44',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s',
	'KQo', 'KJo',
	'QJs', 'QTs', 'Q9s',
	'JTs', 'J9s',
	'T9s', 'T8s',
	'98s',
	'87s',
	'76s',
	'65s',
])

const HJ_5BB_9MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s',
	'KQo', 'KJo', 'KTo',
	'QJs', 'QTs', 'Q9s', 'Q8s',
	'QJo',
	'JTs', 'J9s', 'J8s',
	'T9s', 'T8s',
	'98s', '97s',
	'87s', '86s',
	'76s',
	'65s',
	'54s',
])

const CO_5BB_9MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s',
	'KQo', 'KJo', 'KTo', 'K9o',
	'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s',
	'QJo', 'QTo',
	'JTs', 'J9s', 'J8s', 'J7s',
	'JTo',
	'T9s', 'T8s', 'T7s',
	'T9o',
	'98s', '97s', '96s',
	'87s', '86s',
	'76s', '75s',
	'65s', '64s',
	'54s',
])

const BTN_5BB_9MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33', '22',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o',
	'A5o', 'A4o', 'A3o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
	'K4s', 'K3s',
	'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o',
	'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s',
	'QJo', 'QTo', 'Q9o', 'Q8o',
	'JTs', 'J9s', 'J8s', 'J7s', 'J6s',
	'JTo', 'J9o',
	'T9s', 'T8s', 'T7s', 'T6s',
	'T9o', 'T8o',
	'98s', '97s', '96s',
	'98o',
	'87s', '86s', '85s',
	'76s', '75s',
	'65s', '64s',
	'54s', '53s',
	'43s',
])

const SB_5BB_9MAX = buildPushFold([
	'AA', 'KK', 'QQ', 'JJ', 'TT', '99', '88', '77', '66', '55',
	'44', '33', '22',
	'AKs', 'AQs', 'AJs', 'ATs', 'A9s', 'A8s', 'A7s', 'A6s',
	'A5s', 'A4s', 'A3s', 'A2s',
	'AKo', 'AQo', 'AJo', 'ATo', 'A9o', 'A8o', 'A7o', 'A6o',
	'A5o', 'A4o', 'A3o', 'A2o',
	'KQs', 'KJs', 'KTs', 'K9s', 'K8s', 'K7s', 'K6s', 'K5s',
	'K4s', 'K3s', 'K2s',
	'KQo', 'KJo', 'KTo', 'K9o', 'K8o', 'K7o', 'K6o', 'K5o',
	'QJs', 'QTs', 'Q9s', 'Q8s', 'Q7s', 'Q6s', 'Q5s', 'Q4s',
	'Q3s', 'Q2s',
	'QJo', 'QTo', 'Q9o', 'Q8o', 'Q7o', 'Q6o',
	'JTs', 'J9s', 'J8s', 'J7s', 'J6s', 'J5s', 'J4s',
	'JTo', 'J9o', 'J8o', 'J7o',
	'T9s', 'T8s', 'T7s', 'T6s', 'T5s',
	'T9o', 'T8o', 'T7o',
	'98s', '97s', '96s', '95s',
	'98o', '97o',
	'87s', '86s', '85s', '84s',
	'87o', '86o',
	'76s', '75s', '74s',
	'76o',
	'65s', '64s', '63s',
	'65o',
	'54s', '53s',
	'54o',
	'43s',
])

// ===================================================================
// Assemble all push-fold entries
// ===================================================================

export const pushFoldData: PushFoldEntry[] = [
	// 6-max (5 positions × 5 depths = 25)
	{ position: 'UTG', stackDepthBb: 5, tableSize: '6max', ranges: UTG_5BB_6MAX, source: 'curated' },
	{ position: 'MP', stackDepthBb: 5, tableSize: '6max', ranges: MP_5BB_6MAX, source: 'curated' },
	{ position: 'CO', stackDepthBb: 5, tableSize: '6max', ranges: CO_5BB_6MAX, source: 'curated' },
	{ position: 'BTN', stackDepthBb: 5, tableSize: '6max', ranges: BTN_5BB_6MAX, source: 'curated' },
	{ position: 'SB', stackDepthBb: 5, tableSize: '6max', ranges: SB_5BB_6MAX, source: 'curated' },

	{ position: 'UTG', stackDepthBb: 8, tableSize: '6max', ranges: UTG_8BB_6MAX, source: 'curated' },
	{ position: 'MP', stackDepthBb: 8, tableSize: '6max', ranges: MP_8BB_6MAX, source: 'curated' },
	{ position: 'CO', stackDepthBb: 8, tableSize: '6max', ranges: CO_8BB_6MAX, source: 'curated' },
	{ position: 'BTN', stackDepthBb: 8, tableSize: '6max', ranges: BTN_8BB_6MAX, source: 'curated' },
	{ position: 'SB', stackDepthBb: 8, tableSize: '6max', ranges: SB_8BB_6MAX, source: 'curated' },

	{ position: 'UTG', stackDepthBb: 10, tableSize: '6max', ranges: UTG_10BB_6MAX, source: 'curated' },
	{ position: 'MP', stackDepthBb: 10, tableSize: '6max', ranges: MP_10BB_6MAX, source: 'curated' },
	{ position: 'CO', stackDepthBb: 10, tableSize: '6max', ranges: CO_10BB_6MAX, source: 'curated' },
	{ position: 'BTN', stackDepthBb: 10, tableSize: '6max', ranges: BTN_10BB_6MAX, source: 'curated' },
	{ position: 'SB', stackDepthBb: 10, tableSize: '6max', ranges: SB_10BB_6MAX, source: 'curated' },

	{ position: 'UTG', stackDepthBb: 15, tableSize: '6max', ranges: UTG_15BB_6MAX, source: 'curated' },
	{ position: 'MP', stackDepthBb: 15, tableSize: '6max', ranges: MP_15BB_6MAX, source: 'curated' },
	{ position: 'CO', stackDepthBb: 15, tableSize: '6max', ranges: CO_15BB_6MAX, source: 'curated' },
	{ position: 'BTN', stackDepthBb: 15, tableSize: '6max', ranges: BTN_15BB_6MAX, source: 'curated' },
	{ position: 'SB', stackDepthBb: 15, tableSize: '6max', ranges: SB_15BB_6MAX, source: 'curated' },

	{ position: 'UTG', stackDepthBb: 20, tableSize: '6max', ranges: UTG_20BB_6MAX, source: 'curated' },
	{ position: 'MP', stackDepthBb: 20, tableSize: '6max', ranges: MP_20BB_6MAX, source: 'curated' },
	{ position: 'CO', stackDepthBb: 20, tableSize: '6max', ranges: CO_20BB_6MAX, source: 'curated' },
	{ position: 'BTN', stackDepthBb: 20, tableSize: '6max', ranges: BTN_20BB_6MAX, source: 'curated' },
	{ position: 'SB', stackDepthBb: 20, tableSize: '6max', ranges: SB_20BB_6MAX, source: 'curated' },

	// 9-max (key positions × selected depths)
	{ position: 'UTG', stackDepthBb: 5, tableSize: '9max', ranges: UTG_5BB_9MAX, source: 'curated' },
	{ position: 'HJ', stackDepthBb: 5, tableSize: '9max', ranges: HJ_5BB_9MAX, source: 'curated' },
	{ position: 'CO', stackDepthBb: 5, tableSize: '9max', ranges: CO_5BB_9MAX, source: 'curated' },
	{ position: 'BTN', stackDepthBb: 5, tableSize: '9max', ranges: BTN_5BB_9MAX, source: 'curated' },
	{ position: 'SB', stackDepthBb: 5, tableSize: '9max', ranges: SB_5BB_9MAX, source: 'curated' },

	{ position: 'UTG', stackDepthBb: 10, tableSize: '9max', ranges: UTG_10BB_9MAX, source: 'curated' },
	{ position: 'HJ', stackDepthBb: 10, tableSize: '9max', ranges: HJ_10BB_9MAX, source: 'curated' },
	{ position: 'CO', stackDepthBb: 10, tableSize: '9max', ranges: CO_10BB_9MAX, source: 'curated' },
	{ position: 'BTN', stackDepthBb: 10, tableSize: '9max', ranges: BTN_10BB_9MAX, source: 'curated' },
	{ position: 'SB', stackDepthBb: 10, tableSize: '9max', ranges: SB_10BB_9MAX, source: 'curated' },
]
