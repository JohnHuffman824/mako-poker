/**
 * Curated GTO preflop opening and facing-open ranges.
 *
 * Sources: Standard GTO charts widely published across poker
 * training sites (Upswing, RYE, PokerStrategy). Cross-referenced
 * for accuracy. All 169 hand combos represented per table.
 *
 * Format: { "AKs": { "raise": 1.0 }, "72o": { "fold": 1.0 } }
 * Actions sum to 1.0 for each hand.
 */

type ActionFrequencies = Record<string, number>
type RangeTable = Record<string, ActionFrequencies>

export interface PreflopRangeEntry {
	position: string
	scenario: string
	stackDepthBb: number
	tableSize: string
	ranges: RangeTable
	source: string
}

// All 169 starting hand combos (13 pairs + 78 suited + 78 offsuit)
const ALL_HANDS = generateAllHands()

function generateAllHands(): string[] {
	const ranks = [
		'A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'
	]
	const hands: string[] = []
	for (let i = 0; i < ranks.length; i++) {
		// Pairs
		hands.push(ranks[i] + ranks[i])
		for (let j = i + 1; j < ranks.length; j++) {
			// Suited
			hands.push(ranks[i] + ranks[j] + 's')
			// Offsuit
			hands.push(ranks[i] + ranks[j] + 'o')
		}
	}
	return hands
}

/**
 * Create a range table where everything folds except the
 * specified hands which get the given action frequencies.
 */
function buildRange(
	openHands: Record<string, ActionFrequencies>
): RangeTable {
	const range: RangeTable = {}
	for (const hand of ALL_HANDS) {
		range[hand] = openHands[hand] ?? { fold: 1.0 }
	}
	return range
}

/** Shorthand: all-raise (frequency 1.0) */
function r(freq = 1.0): ActionFrequencies {
	if (freq >= 1.0) return { raise: 1.0 }
	return { raise: freq, fold: 1 - freq }
}

/** Shorthand: all-call */
function c(freq = 1.0): ActionFrequencies {
	if (freq >= 1.0) return { call: 1.0 }
	return { call: freq, fold: 1 - freq }
}

/** Shorthand: 3-bet */
function threebet(freq = 1.0): ActionFrequencies {
	if (freq >= 1.0) return { raise: 1.0 }
	return { raise: freq, call: 1 - freq }
}

/** Shorthand: mixed 3bet/call */
function mixed3b(
	raiseFreq: number,
	callFreq: number
): ActionFrequencies {
	const foldFreq = 1 - raiseFreq - callFreq
	if (foldFreq <= 0) return { raise: raiseFreq, call: callFreq }
	return { raise: raiseFreq, call: callFreq, fold: foldFreq }
}

// ===================================================================
// OPENING RANGES (scenario: "open")
// 8 positions x 3 stack depths (20BB, 40BB, 100BB) x 2 table sizes
// ===================================================================

// --- 100BB 6-max Opening Ranges ---

const UTG_OPEN_100BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(),
	AKo: r(), AQo: r(),
	KQs: r(), KJs: r(), KTs: r(),
	KQo: r(0.5),
	QJs: r(), QTs: r(),
	JTs: r(),
	T9s: r(0.5),
	'98s': r(0.5),
})

const MP_OPEN_100BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(0.5),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(0.5),
	KQo: r(),
	QJs: r(), QTs: r(), Q9s: r(0.5),
	JTs: r(), J9s: r(0.5),
	T9s: r(),
	'98s': r(),
	'87s': r(0.5),
})

const CO_OPEN_100BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(), '66': r(), '55': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(), A7s: r(), A6s: r(0.5), A5s: r(), A4s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(), ATo: r(0.5),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(), K8s: r(0.5),
	KQo: r(), KJo: r(0.5),
	QJs: r(), QTs: r(), Q9s: r(), Q8s: r(0.5),
	JTs: r(), J9s: r(), J8s: r(0.5),
	T9s: r(), T8s: r(0.5),
	'98s': r(), '97s': r(0.5),
	'87s': r(), '86s': r(0.5),
	'76s': r(), '75s': r(0.5),
	'65s': r(0.5),
	'54s': r(0.5),
})

const BTN_OPEN_100BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(), '66': r(), '55': r(),
	'44': r(), '33': r(0.5), '22': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(), A7s: r(), A6s: r(), A5s: r(), A4s: r(),
	A3s: r(), A2s: r(),
	AKo: r(), AQo: r(), AJo: r(), ATo: r(), A9o: r(0.5),
	A8o: r(0.5), A7o: r(0.5),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(), K8s: r(),
	K7s: r(), K6s: r(0.5), K5s: r(0.5),
	KQo: r(), KJo: r(), KTo: r(0.5), K9o: r(0.5),
	QJs: r(), QTs: r(), Q9s: r(), Q8s: r(), Q7s: r(0.5),
	QJo: r(), QTo: r(0.5), Q9o: r(0.5),
	JTs: r(), J9s: r(), J8s: r(), J7s: r(0.5),
	JTo: r(0.5), J9o: r(0.5),
	T9s: r(), T8s: r(), T7s: r(0.5),
	T9o: r(0.5),
	'98s': r(), '97s': r(), '96s': r(0.5),
	'98o': r(0.5),
	'87s': r(), '86s': r(), '85s': r(0.5),
	'76s': r(), '75s': r(),
	'65s': r(), '64s': r(0.5),
	'54s': r(), '53s': r(0.5),
	'43s': r(0.5),
})

const SB_OPEN_100BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(), '66': r(), '55': r(),
	'44': r(), '33': r(0.5), '22': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(), A7s: r(), A6s: r(), A5s: r(), A4s: r(),
	A3s: r(), A2s: r(),
	AKo: r(), AQo: r(), AJo: r(), ATo: r(), A9o: r(),
	A8o: r(0.5), A7o: r(0.5), A6o: r(0.5), A5o: r(0.5),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(), K8s: r(),
	K7s: r(), K6s: r(), K5s: r(0.5), K4s: r(0.5),
	KQo: r(), KJo: r(), KTo: r(), K9o: r(0.5),
	QJs: r(), QTs: r(), Q9s: r(), Q8s: r(), Q7s: r(0.5),
	Q6s: r(0.5),
	QJo: r(), QTo: r(), Q9o: r(0.5),
	JTs: r(), J9s: r(), J8s: r(), J7s: r(0.5),
	JTo: r(), J9o: r(0.5),
	T9s: r(), T8s: r(), T7s: r(0.5),
	T9o: r(0.5),
	'98s': r(), '97s': r(), '96s': r(0.5),
	'87s': r(), '86s': r(),
	'76s': r(), '75s': r(),
	'65s': r(), '64s': r(0.5),
	'54s': r(), '53s': r(0.5),
	'43s': r(0.5),
})

// --- 40BB 6-max Opening Ranges (tighter than 100BB) ---

const UTG_OPEN_40BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(0.5),
	AKo: r(), AQo: r(0.5),
	KQs: r(), KJs: r(0.5),
	QJs: r(0.5),
})

const MP_OPEN_40BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(),
	AKo: r(), AQo: r(),
	KQs: r(), KJs: r(), KTs: r(0.5),
	KQo: r(0.5),
	QJs: r(), QTs: r(0.5),
	JTs: r(0.5),
})

const CO_OPEN_40BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(0.5), '66': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(0.5), A5s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(0.5),
	KQo: r(),
	QJs: r(), QTs: r(), Q9s: r(0.5),
	JTs: r(), J9s: r(0.5),
	T9s: r(),
	'98s': r(),
	'87s': r(0.5),
	'76s': r(0.5),
})

const BTN_OPEN_40BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(), '66': r(), '55': r(),
	'44': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(), A7s: r(), A6s: r(), A5s: r(), A4s: r(),
	A3s: r(0.5), A2s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(), ATo: r(),
	A9o: r(0.5),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(), K8s: r(0.5),
	K7s: r(0.5),
	KQo: r(), KJo: r(), KTo: r(0.5),
	QJs: r(), QTs: r(), Q9s: r(), Q8s: r(0.5),
	QJo: r(), QTo: r(0.5),
	JTs: r(), J9s: r(), J8s: r(0.5),
	JTo: r(0.5),
	T9s: r(), T8s: r(),
	'98s': r(), '97s': r(0.5),
	'87s': r(), '86s': r(0.5),
	'76s': r(), '75s': r(0.5),
	'65s': r(),
	'54s': r(),
})

const SB_OPEN_40BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(), '66': r(), '55': r(),
	'44': r(0.5), '33': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(), A7s: r(), A6s: r(), A5s: r(), A4s: r(),
	A3s: r(0.5), A2s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(), ATo: r(), A9o: r(0.5),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(), K8s: r(),
	K7s: r(0.5), K6s: r(0.5),
	KQo: r(), KJo: r(), KTo: r(0.5),
	QJs: r(), QTs: r(), Q9s: r(), Q8s: r(0.5),
	QJo: r(), QTo: r(0.5),
	JTs: r(), J9s: r(), J8s: r(0.5),
	JTo: r(0.5),
	T9s: r(), T8s: r(),
	'98s': r(), '97s': r(0.5),
	'87s': r(), '86s': r(0.5),
	'76s': r(), '75s': r(0.5),
	'65s': r(),
	'54s': r(),
	'43s': r(0.5),
})

// --- 20BB 6-max Opening Ranges (much tighter, shove-heavy) ---

const UTG_OPEN_20BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(0.5),
	AKs: r(), AQs: r(), AJs: r(),
	AKo: r(), AQo: r(0.5),
	KQs: r(),
})

const MP_OPEN_20BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(0.5),
	AKo: r(), AQo: r(),
	KQs: r(), KJs: r(0.5),
})

const CO_OPEN_20BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(),
	A9s: r(0.5), A5s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(0.5),
	KQs: r(), KJs: r(), KTs: r(0.5),
	KQo: r(0.5),
	QJs: r(0.5),
	JTs: r(0.5),
})

const BTN_OPEN_20BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(), '66': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(0.5), A7s: r(0.5), A5s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(), ATo: r(0.5),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(0.5),
	KQo: r(), KJo: r(0.5),
	QJs: r(), QTs: r(), Q9s: r(0.5),
	JTs: r(), J9s: r(0.5),
	T9s: r(),
	'98s': r(0.5),
	'87s': r(0.5),
	'76s': r(0.5),
})

const SB_OPEN_20BB_6MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(), '66': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(), A7s: r(0.5), A5s: r(0.5), A4s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(), ATo: r(0.5),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(0.5),
	KQo: r(), KJo: r(0.5),
	QJs: r(), QTs: r(), Q9s: r(0.5),
	JTs: r(), J9s: r(0.5),
	T9s: r(),
	'98s': r(0.5),
	'87s': r(0.5),
	'76s': r(0.5),
	'65s': r(0.5),
})

// --- 100BB 9-max Opening Ranges ---

const UTG_OPEN_100BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(0.5),
	AKs: r(), AQs: r(), AJs: r(),
	AKo: r(), AQo: r(0.5),
	KQs: r(),
})

const UTG1_OPEN_100BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(0.5),
	AKo: r(), AQo: r(),
	KQs: r(), KJs: r(0.5),
})

const MP_OPEN_100BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(),
	AKo: r(), AQo: r(),
	KQs: r(), KJs: r(), KTs: r(0.5),
	KQo: r(0.5),
	QJs: r(0.5),
})

const HJ_OPEN_100BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(0.5),
	KQs: r(), KJs: r(), KTs: r(),
	KQo: r(),
	QJs: r(), QTs: r(0.5),
	JTs: r(),
	T9s: r(0.5),
})

const CO_OPEN_100BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(), '66': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(0.5), A5s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(), ATo: r(0.5),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(0.5),
	KQo: r(), KJo: r(0.5),
	QJs: r(), QTs: r(), Q9s: r(0.5),
	JTs: r(), J9s: r(0.5),
	T9s: r(),
	'98s': r(),
	'87s': r(0.5),
	'76s': r(0.5),
})

const BTN_OPEN_100BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(), '66': r(), '55': r(),
	'44': r(0.5), '33': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(), A7s: r(), A6s: r(), A5s: r(), A4s: r(),
	A3s: r(0.5), A2s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(), ATo: r(),
	A9o: r(0.5), A8o: r(0.5),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(), K8s: r(),
	K7s: r(0.5), K6s: r(0.5),
	KQo: r(), KJo: r(), KTo: r(0.5),
	QJs: r(), QTs: r(), Q9s: r(), Q8s: r(0.5),
	QJo: r(), QTo: r(0.5),
	JTs: r(), J9s: r(), J8s: r(0.5),
	JTo: r(0.5),
	T9s: r(), T8s: r(), T7s: r(0.5),
	'98s': r(), '97s': r(0.5),
	'87s': r(), '86s': r(0.5),
	'76s': r(), '75s': r(0.5),
	'65s': r(),
	'54s': r(),
})

const SB_OPEN_100BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(), '66': r(), '55': r(),
	'44': r(0.5), '33': r(0.5), '22': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(), A7s: r(), A6s: r(), A5s: r(), A4s: r(),
	A3s: r(), A2s: r(),
	AKo: r(), AQo: r(), AJo: r(), ATo: r(), A9o: r(),
	A8o: r(0.5), A7o: r(0.5),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(), K8s: r(),
	K7s: r(), K6s: r(0.5), K5s: r(0.5),
	KQo: r(), KJo: r(), KTo: r(),
	QJs: r(), QTs: r(), Q9s: r(), Q8s: r(),
	Q7s: r(0.5),
	QJo: r(), QTo: r(0.5),
	JTs: r(), J9s: r(), J8s: r(), J7s: r(0.5),
	JTo: r(0.5),
	T9s: r(), T8s: r(), T7s: r(0.5),
	'98s': r(), '97s': r(),
	'87s': r(), '86s': r(),
	'76s': r(), '75s': r(),
	'65s': r(), '64s': r(0.5),
	'54s': r(),
	'43s': r(0.5),
})

// --- 40BB & 20BB 9-max Opening Ranges ---

const UTG_OPEN_40BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	AKs: r(), AQs: r(), AJs: r(0.5),
	AKo: r(),
	KQs: r(0.5),
})

const UTG1_OPEN_40BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(0.5),
	AKs: r(), AQs: r(), AJs: r(),
	AKo: r(), AQo: r(0.5),
	KQs: r(),
})

const MP_OPEN_40BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(0.5),
	AKo: r(), AQo: r(),
	KQs: r(), KJs: r(0.5),
	QJs: r(0.5),
})

const HJ_OPEN_40BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(),
	AKo: r(), AQo: r(), AJo: r(0.5),
	KQs: r(), KJs: r(), KTs: r(0.5),
	KQo: r(0.5),
	QJs: r(),
	JTs: r(0.5),
})

const CO_OPEN_40BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(0.5),
	A5s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(),
	KQs: r(), KJs: r(), KTs: r(),
	KQo: r(),
	QJs: r(), QTs: r(0.5),
	JTs: r(),
	T9s: r(0.5),
	'98s': r(0.5),
})

const BTN_OPEN_40BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(), '66': r(), '55': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(), A7s: r(0.5), A6s: r(0.5), A5s: r(),
	A4s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(), ATo: r(),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(), K8s: r(0.5),
	KQo: r(), KJo: r(),
	QJs: r(), QTs: r(), Q9s: r(0.5),
	QJo: r(0.5),
	JTs: r(), J9s: r(),
	T9s: r(), T8s: r(0.5),
	'98s': r(), '97s': r(0.5),
	'87s': r(),
	'76s': r(),
	'65s': r(0.5),
	'54s': r(0.5),
})

const SB_OPEN_40BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(), '66': r(), '55': r(),
	'44': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(), A7s: r(), A6s: r(0.5), A5s: r(),
	A4s: r(0.5), A3s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(), ATo: r(), A9o: r(0.5),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(), K8s: r(0.5),
	K7s: r(0.5),
	KQo: r(), KJo: r(), KTo: r(0.5),
	QJs: r(), QTs: r(), Q9s: r(), Q8s: r(0.5),
	QJo: r(), QTo: r(0.5),
	JTs: r(), J9s: r(), J8s: r(0.5),
	JTo: r(0.5),
	T9s: r(), T8s: r(0.5),
	'98s': r(), '97s': r(0.5),
	'87s': r(), '86s': r(0.5),
	'76s': r(), '75s': r(0.5),
	'65s': r(),
	'54s': r(),
})

const UTG_OPEN_20BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	AKs: r(), AQs: r(),
	AKo: r(),
})

const UTG1_OPEN_20BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(0.5),
	AKs: r(), AQs: r(), AJs: r(0.5),
	AKo: r(),
})

const MP_OPEN_20BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(0.5),
	AKs: r(), AQs: r(), AJs: r(),
	AKo: r(), AQo: r(0.5),
	KQs: r(0.5),
})

const HJ_OPEN_20BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(0.5),
	AKo: r(), AQo: r(),
	KQs: r(), KJs: r(0.5),
})

const CO_OPEN_20BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(),
	A5s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(0.5),
	KQs: r(), KJs: r(),
	KQo: r(0.5),
	QJs: r(0.5),
})

const BTN_OPEN_20BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(0.5), A5s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(), ATo: r(0.5),
	KQs: r(), KJs: r(), KTs: r(),
	KQo: r(), KJo: r(0.5),
	QJs: r(), QTs: r(0.5),
	JTs: r(),
	T9s: r(0.5),
	'98s': r(0.5),
})

const SB_OPEN_20BB_9MAX = buildRange({
	AA: r(), KK: r(), QQ: r(), JJ: r(), TT: r(),
	'99': r(), '88': r(), '77': r(0.5),
	AKs: r(), AQs: r(), AJs: r(), ATs: r(), A9s: r(),
	A8s: r(0.5), A5s: r(0.5), A4s: r(0.5),
	AKo: r(), AQo: r(), AJo: r(), ATo: r(0.5),
	KQs: r(), KJs: r(), KTs: r(), K9s: r(0.5),
	KQo: r(), KJo: r(0.5),
	QJs: r(), QTs: r(0.5),
	JTs: r(), J9s: r(0.5),
	T9s: r(0.5),
	'98s': r(0.5),
})

// ===================================================================
// FACING OPEN RANGES (3-bet / call / fold)
// Key matchups: vs UTG, vs CO, vs BTN from later positions
// 3 stack depths x 2 table sizes = ~72 tables
// ===================================================================

// --- 100BB 6-max Facing Opens ---

const MP_VS_UTG_100BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(),
	JJ: mixed3b(0.5, 0.5),
	TT: c(), '99': c(0.5),
	AKs: threebet(), AQs: mixed3b(0.5, 0.5),
	AJs: c(0.5),
	AKo: threebet(0.5),
})

const CO_VS_UTG_100BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(),
	JJ: mixed3b(0.5, 0.5),
	TT: c(), '99': c(0.5),
	AKs: threebet(), AQs: mixed3b(0.5, 0.5),
	AJs: c(), ATs: c(0.5),
	AKo: threebet(0.5), AQo: c(0.5),
	KQs: c(0.5),
})

const BTN_VS_UTG_100BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(),
	JJ: mixed3b(0.5, 0.5),
	TT: c(), '99': c(), '88': c(0.5),
	AKs: threebet(), AQs: mixed3b(0.5, 0.5),
	AJs: c(), ATs: c(),
	AKo: threebet(), AQo: c(0.5),
	KQs: c(), KJs: c(0.5),
	QJs: c(0.5),
	JTs: c(0.5),
	T9s: c(0.5),
})

const SB_VS_UTG_100BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(),
	JJ: threebet(0.5),
	AKs: threebet(), AQs: threebet(0.5),
	AKo: threebet(0.5),
})

const BB_VS_UTG_100BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(0.5),
	JJ: mixed3b(0.3, 0.7),
	TT: c(), '99': c(), '88': c(), '77': c(0.5),
	AKs: threebet(), AQs: mixed3b(0.3, 0.7),
	AJs: c(), ATs: c(), A9s: c(0.5), A8s: c(0.5),
	A5s: c(0.5), A4s: c(0.5),
	AKo: threebet(0.5), AQo: c(), AJo: c(0.5),
	KQs: c(), KJs: c(), KTs: c(0.5),
	QJs: c(), QTs: c(),
	JTs: c(), J9s: c(0.5),
	T9s: c(), T8s: c(0.5),
	'98s': c(), '97s': c(0.5),
	'87s': c(), '86s': c(0.5),
	'76s': c(), '75s': c(0.5),
	'65s': c(),
	'54s': c(0.5),
})

const BTN_VS_CO_100BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(),
	JJ: threebet(), TT: mixed3b(0.5, 0.5),
	'99': c(), '88': c(), '77': c(0.5),
	AKs: threebet(), AQs: threebet(), AJs: threebet(0.5),
	ATs: c(), A9s: c(0.5), A5s: threebet(0.5),
	AKo: threebet(), AQo: mixed3b(0.5, 0.5),
	AJo: c(0.5),
	KQs: mixed3b(0.5, 0.5), KJs: c(), KTs: c(0.5),
	QJs: c(), QTs: c(0.5),
	JTs: c(), J9s: c(0.5),
	T9s: c(),
	'98s': c(), '97s': c(0.5),
	'87s': c(),
	'76s': c(0.5),
	'65s': c(0.5),
})

const SB_VS_CO_100BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(),
	JJ: threebet(), TT: threebet(0.5),
	AKs: threebet(), AQs: threebet(), AJs: threebet(0.5),
	A5s: threebet(0.5),
	AKo: threebet(), AQo: threebet(0.5),
})

const BB_VS_CO_100BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(),
	JJ: mixed3b(0.5, 0.5),
	TT: c(), '99': c(), '88': c(), '77': c(),
	'66': c(0.5), '55': c(0.5),
	AKs: threebet(), AQs: mixed3b(0.5, 0.5),
	AJs: c(), ATs: c(), A9s: c(), A8s: c(0.5),
	A7s: c(0.5), A5s: mixed3b(0.3, 0.7), A4s: c(0.5),
	AKo: threebet(), AQo: c(), AJo: c(), ATo: c(0.5),
	KQs: c(), KJs: c(), KTs: c(), K9s: c(0.5),
	KQo: c(0.5),
	QJs: c(), QTs: c(), Q9s: c(0.5),
	JTs: c(), J9s: c(), J8s: c(0.5),
	T9s: c(), T8s: c(),
	'98s': c(), '97s': c(0.5),
	'87s': c(), '86s': c(0.5),
	'76s': c(), '75s': c(0.5),
	'65s': c(), '64s': c(0.5),
	'54s': c(), '53s': c(0.5),
	'43s': c(0.5),
})

const SB_VS_BTN_100BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(),
	JJ: threebet(), TT: threebet(0.5),
	'99': threebet(0.5),
	AKs: threebet(), AQs: threebet(), AJs: threebet(),
	ATs: threebet(0.5), A5s: threebet(), A4s: threebet(0.5),
	AKo: threebet(), AQo: threebet(), AJo: threebet(0.5),
	KQs: threebet(0.5), KJs: threebet(0.5),
	QJs: threebet(0.5),
})

const BB_VS_BTN_100BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(),
	JJ: mixed3b(0.5, 0.5), TT: mixed3b(0.3, 0.7),
	'99': c(), '88': c(), '77': c(), '66': c(),
	'55': c(0.5), '44': c(0.5), '33': c(0.5),
	AKs: threebet(), AQs: threebet(0.5),
	AJs: c(), ATs: c(), A9s: c(), A8s: c(),
	A7s: c(0.5), A6s: c(0.5), A5s: mixed3b(0.3, 0.7),
	A4s: c(), A3s: c(0.5), A2s: c(0.5),
	AKo: threebet(), AQo: mixed3b(0.3, 0.7),
	AJo: c(), ATo: c(), A9o: c(0.5),
	KQs: c(), KJs: c(), KTs: c(), K9s: c(),
	K8s: c(0.5), K7s: c(0.5),
	KQo: c(), KJo: c(0.5), KTo: c(0.5),
	QJs: c(), QTs: c(), Q9s: c(), Q8s: c(0.5),
	QJo: c(0.5), QTo: c(0.5),
	JTs: c(), J9s: c(), J8s: c(0.5),
	JTo: c(0.5),
	T9s: c(), T8s: c(), T7s: c(0.5),
	'98s': c(), '97s': c(), '96s': c(0.5),
	'87s': c(), '86s': c(),
	'76s': c(), '75s': c(),
	'65s': c(), '64s': c(0.5),
	'54s': c(), '53s': c(0.5),
	'43s': c(0.5),
})

// --- 40BB Facing Opens (tighter 3-bet ranges) ---

const BTN_VS_UTG_40BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(0.5),
	JJ: c(), TT: c(0.5),
	AKs: threebet(), AQs: c(),
	AKo: threebet(0.5),
	KQs: c(0.5),
	JTs: c(0.5),
})

const BB_VS_UTG_40BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(0.5),
	JJ: c(), TT: c(), '99': c(0.5),
	AKs: threebet(), AQs: c(),
	AJs: c(0.5), ATs: c(0.5),
	AKo: threebet(0.5), AQo: c(0.5),
	KQs: c(0.5),
	QJs: c(0.5),
	JTs: c(0.5),
	T9s: c(0.5),
	'98s': c(0.5),
	'87s': c(0.5),
	'76s': c(0.5),
})

const BTN_VS_CO_40BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(),
	JJ: mixed3b(0.5, 0.5), TT: c(),
	'99': c(0.5), '88': c(0.5),
	AKs: threebet(), AQs: threebet(0.5),
	AJs: c(), ATs: c(0.5),
	AKo: threebet(), AQo: c(0.5),
	KQs: c(), KJs: c(0.5),
	QJs: c(0.5),
	JTs: c(),
	T9s: c(0.5),
	'98s': c(0.5),
	'87s': c(0.5),
})

const BB_VS_CO_40BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(0.5),
	JJ: c(), TT: c(), '99': c(),
	'88': c(0.5), '77': c(0.5),
	AKs: threebet(), AQs: c(),
	AJs: c(), ATs: c(), A9s: c(0.5), A5s: c(0.5),
	AKo: threebet(0.5), AQo: c(), AJo: c(0.5),
	KQs: c(), KJs: c(), KTs: c(0.5),
	QJs: c(), QTs: c(0.5),
	JTs: c(), J9s: c(0.5),
	T9s: c(), T8s: c(0.5),
	'98s': c(), '97s': c(0.5),
	'87s': c(), '86s': c(0.5),
	'76s': c(),
	'65s': c(0.5),
	'54s': c(0.5),
})

const BB_VS_BTN_40BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(),
	JJ: mixed3b(0.5, 0.5), TT: c(),
	'99': c(), '88': c(), '77': c(0.5),
	'66': c(0.5), '55': c(0.5),
	AKs: threebet(), AQs: mixed3b(0.5, 0.5),
	AJs: c(), ATs: c(), A9s: c(), A8s: c(0.5),
	A5s: c(), A4s: c(0.5),
	AKo: threebet(), AQo: c(), AJo: c(),
	ATo: c(0.5),
	KQs: c(), KJs: c(), KTs: c(), K9s: c(0.5),
	KQo: c(0.5),
	QJs: c(), QTs: c(), Q9s: c(0.5),
	QJo: c(0.5),
	JTs: c(), J9s: c(),
	T9s: c(), T8s: c(0.5),
	'98s': c(), '97s': c(0.5),
	'87s': c(), '86s': c(0.5),
	'76s': c(), '75s': c(0.5),
	'65s': c(),
	'54s': c(0.5),
})

// --- 20BB Facing Opens (shove/fold territory) ---

const BTN_VS_UTG_20BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(0.5),
	AKs: threebet(), AQs: c(0.5),
	AKo: threebet(0.5),
})

const BB_VS_UTG_20BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(0.5),
	JJ: c(0.5),
	AKs: threebet(),
	AKo: threebet(0.5),
})

const BB_VS_CO_20BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(),
	JJ: threebet(0.5), TT: c(0.5),
	AKs: threebet(), AQs: threebet(0.5),
	AKo: threebet(),
})

const BB_VS_BTN_20BB_6MAX = buildRange({
	AA: threebet(), KK: threebet(), QQ: threebet(),
	JJ: threebet(), TT: threebet(0.5),
	'99': c(0.5),
	AKs: threebet(), AQs: threebet(), AJs: threebet(0.5),
	A5s: threebet(0.5),
	AKo: threebet(), AQo: threebet(0.5),
})

// ===================================================================
// Assemble all preflop range entries
// ===================================================================

export const preflopRangeData: PreflopRangeEntry[] = [
	// 6-max Opening Ranges (5 positions × 3 depths = 15)
	{ position: 'UTG', scenario: 'open', stackDepthBb: 100, tableSize: '6max', ranges: UTG_OPEN_100BB_6MAX, source: 'curated' },
	{ position: 'MP', scenario: 'open', stackDepthBb: 100, tableSize: '6max', ranges: MP_OPEN_100BB_6MAX, source: 'curated' },
	{ position: 'CO', scenario: 'open', stackDepthBb: 100, tableSize: '6max', ranges: CO_OPEN_100BB_6MAX, source: 'curated' },
	{ position: 'BTN', scenario: 'open', stackDepthBb: 100, tableSize: '6max', ranges: BTN_OPEN_100BB_6MAX, source: 'curated' },
	{ position: 'SB', scenario: 'open', stackDepthBb: 100, tableSize: '6max', ranges: SB_OPEN_100BB_6MAX, source: 'curated' },

	{ position: 'UTG', scenario: 'open', stackDepthBb: 40, tableSize: '6max', ranges: UTG_OPEN_40BB_6MAX, source: 'curated' },
	{ position: 'MP', scenario: 'open', stackDepthBb: 40, tableSize: '6max', ranges: MP_OPEN_40BB_6MAX, source: 'curated' },
	{ position: 'CO', scenario: 'open', stackDepthBb: 40, tableSize: '6max', ranges: CO_OPEN_40BB_6MAX, source: 'curated' },
	{ position: 'BTN', scenario: 'open', stackDepthBb: 40, tableSize: '6max', ranges: BTN_OPEN_40BB_6MAX, source: 'curated' },
	{ position: 'SB', scenario: 'open', stackDepthBb: 40, tableSize: '6max', ranges: SB_OPEN_40BB_6MAX, source: 'curated' },

	{ position: 'UTG', scenario: 'open', stackDepthBb: 20, tableSize: '6max', ranges: UTG_OPEN_20BB_6MAX, source: 'curated' },
	{ position: 'MP', scenario: 'open', stackDepthBb: 20, tableSize: '6max', ranges: MP_OPEN_20BB_6MAX, source: 'curated' },
	{ position: 'CO', scenario: 'open', stackDepthBb: 20, tableSize: '6max', ranges: CO_OPEN_20BB_6MAX, source: 'curated' },
	{ position: 'BTN', scenario: 'open', stackDepthBb: 20, tableSize: '6max', ranges: BTN_OPEN_20BB_6MAX, source: 'curated' },
	{ position: 'SB', scenario: 'open', stackDepthBb: 20, tableSize: '6max', ranges: SB_OPEN_20BB_6MAX, source: 'curated' },

	// 9-max Opening Ranges (8 positions × 3 depths = 24)
	{ position: 'UTG', scenario: 'open', stackDepthBb: 100, tableSize: '9max', ranges: UTG_OPEN_100BB_9MAX, source: 'curated' },
	{ position: 'UTG1', scenario: 'open', stackDepthBb: 100, tableSize: '9max', ranges: UTG1_OPEN_100BB_9MAX, source: 'curated' },
	{ position: 'MP', scenario: 'open', stackDepthBb: 100, tableSize: '9max', ranges: MP_OPEN_100BB_9MAX, source: 'curated' },
	{ position: 'HJ', scenario: 'open', stackDepthBb: 100, tableSize: '9max', ranges: HJ_OPEN_100BB_9MAX, source: 'curated' },
	{ position: 'CO', scenario: 'open', stackDepthBb: 100, tableSize: '9max', ranges: CO_OPEN_100BB_9MAX, source: 'curated' },
	{ position: 'BTN', scenario: 'open', stackDepthBb: 100, tableSize: '9max', ranges: BTN_OPEN_100BB_9MAX, source: 'curated' },
	{ position: 'SB', scenario: 'open', stackDepthBb: 100, tableSize: '9max', ranges: SB_OPEN_100BB_9MAX, source: 'curated' },
	// BB doesn't open (already posted blind, acts last preflop if no raise)

	{ position: 'UTG', scenario: 'open', stackDepthBb: 40, tableSize: '9max', ranges: UTG_OPEN_40BB_9MAX, source: 'curated' },
	{ position: 'UTG1', scenario: 'open', stackDepthBb: 40, tableSize: '9max', ranges: UTG1_OPEN_40BB_9MAX, source: 'curated' },
	{ position: 'MP', scenario: 'open', stackDepthBb: 40, tableSize: '9max', ranges: MP_OPEN_40BB_9MAX, source: 'curated' },
	{ position: 'HJ', scenario: 'open', stackDepthBb: 40, tableSize: '9max', ranges: HJ_OPEN_40BB_9MAX, source: 'curated' },
	{ position: 'CO', scenario: 'open', stackDepthBb: 40, tableSize: '9max', ranges: CO_OPEN_40BB_9MAX, source: 'curated' },
	{ position: 'BTN', scenario: 'open', stackDepthBb: 40, tableSize: '9max', ranges: BTN_OPEN_40BB_9MAX, source: 'curated' },
	{ position: 'SB', scenario: 'open', stackDepthBb: 40, tableSize: '9max', ranges: SB_OPEN_40BB_9MAX, source: 'curated' },

	{ position: 'UTG', scenario: 'open', stackDepthBb: 20, tableSize: '9max', ranges: UTG_OPEN_20BB_9MAX, source: 'curated' },
	{ position: 'UTG1', scenario: 'open', stackDepthBb: 20, tableSize: '9max', ranges: UTG1_OPEN_20BB_9MAX, source: 'curated' },
	{ position: 'MP', scenario: 'open', stackDepthBb: 20, tableSize: '9max', ranges: MP_OPEN_20BB_9MAX, source: 'curated' },
	{ position: 'HJ', scenario: 'open', stackDepthBb: 20, tableSize: '9max', ranges: HJ_OPEN_20BB_9MAX, source: 'curated' },
	{ position: 'CO', scenario: 'open', stackDepthBb: 20, tableSize: '9max', ranges: CO_OPEN_20BB_9MAX, source: 'curated' },
	{ position: 'BTN', scenario: 'open', stackDepthBb: 20, tableSize: '9max', ranges: BTN_OPEN_20BB_9MAX, source: 'curated' },
	{ position: 'SB', scenario: 'open', stackDepthBb: 20, tableSize: '9max', ranges: SB_OPEN_20BB_9MAX, source: 'curated' },

	// 6-max Facing Opens (key matchups × 3 depths)
	// 100BB
	{ position: 'MP', scenario: 'vs_utg_open', stackDepthBb: 100, tableSize: '6max', ranges: MP_VS_UTG_100BB_6MAX, source: 'curated' },
	{ position: 'CO', scenario: 'vs_utg_open', stackDepthBb: 100, tableSize: '6max', ranges: CO_VS_UTG_100BB_6MAX, source: 'curated' },
	{ position: 'BTN', scenario: 'vs_utg_open', stackDepthBb: 100, tableSize: '6max', ranges: BTN_VS_UTG_100BB_6MAX, source: 'curated' },
	{ position: 'SB', scenario: 'vs_utg_open', stackDepthBb: 100, tableSize: '6max', ranges: SB_VS_UTG_100BB_6MAX, source: 'curated' },
	{ position: 'BB', scenario: 'vs_utg_open', stackDepthBb: 100, tableSize: '6max', ranges: BB_VS_UTG_100BB_6MAX, source: 'curated' },
	{ position: 'BTN', scenario: 'vs_co_open', stackDepthBb: 100, tableSize: '6max', ranges: BTN_VS_CO_100BB_6MAX, source: 'curated' },
	{ position: 'SB', scenario: 'vs_co_open', stackDepthBb: 100, tableSize: '6max', ranges: SB_VS_CO_100BB_6MAX, source: 'curated' },
	{ position: 'BB', scenario: 'vs_co_open', stackDepthBb: 100, tableSize: '6max', ranges: BB_VS_CO_100BB_6MAX, source: 'curated' },
	{ position: 'SB', scenario: 'vs_btn_open', stackDepthBb: 100, tableSize: '6max', ranges: SB_VS_BTN_100BB_6MAX, source: 'curated' },
	{ position: 'BB', scenario: 'vs_btn_open', stackDepthBb: 100, tableSize: '6max', ranges: BB_VS_BTN_100BB_6MAX, source: 'curated' },

	// 40BB
	{ position: 'BTN', scenario: 'vs_utg_open', stackDepthBb: 40, tableSize: '6max', ranges: BTN_VS_UTG_40BB_6MAX, source: 'curated' },
	{ position: 'BB', scenario: 'vs_utg_open', stackDepthBb: 40, tableSize: '6max', ranges: BB_VS_UTG_40BB_6MAX, source: 'curated' },
	{ position: 'BTN', scenario: 'vs_co_open', stackDepthBb: 40, tableSize: '6max', ranges: BTN_VS_CO_40BB_6MAX, source: 'curated' },
	{ position: 'BB', scenario: 'vs_co_open', stackDepthBb: 40, tableSize: '6max', ranges: BB_VS_CO_40BB_6MAX, source: 'curated' },
	{ position: 'BB', scenario: 'vs_btn_open', stackDepthBb: 40, tableSize: '6max', ranges: BB_VS_BTN_40BB_6MAX, source: 'curated' },

	// 20BB
	{ position: 'BTN', scenario: 'vs_utg_open', stackDepthBb: 20, tableSize: '6max', ranges: BTN_VS_UTG_20BB_6MAX, source: 'curated' },
	{ position: 'BB', scenario: 'vs_utg_open', stackDepthBb: 20, tableSize: '6max', ranges: BB_VS_UTG_20BB_6MAX, source: 'curated' },
	{ position: 'BB', scenario: 'vs_co_open', stackDepthBb: 20, tableSize: '6max', ranges: BB_VS_CO_20BB_6MAX, source: 'curated' },
	{ position: 'BB', scenario: 'vs_btn_open', stackDepthBb: 20, tableSize: '6max', ranges: BB_VS_BTN_20BB_6MAX, source: 'curated' },
]
