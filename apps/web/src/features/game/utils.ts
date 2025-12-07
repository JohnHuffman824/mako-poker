/**
 * Formats BB value, only showing decimal if necessary
 */
export const formatBB = (bb: number): string => {
	return bb % 1 === 0 ? bb.toString() : bb.toFixed(1)
}
