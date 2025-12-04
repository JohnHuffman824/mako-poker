import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RangeGrid } from "@/components/ui/range-grid";
import { Edit } from "lucide-react";

interface OpponentRangeProps {
	estimatedRange: string[];
	onRangeUpdate?: (newRange: string[]) => void;
	readonly?: boolean;
}

export function OpponentRange({ estimatedRange, onRangeUpdate, readonly = false }: OpponentRangeProps) {
	const [isEditing, setIsEditing] = useState(false);
	const [editedRange, setEditedRange] = useState(estimatedRange);
	
	const handleHandToggle = (hand: string) => {
		if (editedRange.includes(hand)) {
			setEditedRange(editedRange.filter(h => h !== hand));
		} else {
			setEditedRange([...editedRange, hand]);
		}
	};
	
	const handleSave = () => {
		if (onRangeUpdate) {
			onRangeUpdate(editedRange);
		}
		setIsEditing(false);
	};
	
	const handleCancel = () => {
		setEditedRange(estimatedRange);
		setIsEditing(false);
	};
	
	// Calculate range statistics
	const calculateRangeStats = (range: string[]) => {
		const totalCombos = 1326; // Total possible hand combinations
		const selectedCombos = range.length * 6; // Simplified calculation
		
		const premiumHands = range.filter(hand => 
			hand.includes('A') && (hand.includes('K') || hand.includes('Q')) ||
			['AA', 'KK', 'QQ', 'JJ'].includes(hand)
		).length;
		
		const playableHands = range.filter(hand =>
			hand.includes('A') || hand.includes('K') || hand.includes('Q') ||
			['TT', '99', '88', '77'].includes(hand)
		).length - premiumHands;
		
		const bluffHands = range.length - premiumHands - playableHands;
		
		return {
			premium: (premiumHands / range.length * 100) || 0,
			playable: (playableHands / range.length * 100) || 0,
			bluff: (bluffHands / range.length * 100) || 0,
			totalPercent: (selectedCombos / totalCombos * 100) || 0
		};
	};
	
	const currentRange = isEditing ? editedRange : estimatedRange;
	const stats = calculateRangeStats(currentRange);
	
	return (
		<Card>
			<CardContent className="p-6">
				<div className="flex items-center justify-between mb-4">
					<h3 className="text-lg font-semibold text-gray-900">Opponent Range</h3>
					{!readonly && (
						<Button
							variant="ghost"
							size="sm"
							onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
							className="text-xs text-blue-600 hover:text-blue-700"
						>
							<Edit className="mr-1 h-3 w-3" />
							{isEditing ? 'Cancel' : 'Edit'}
						</Button>
					)}
				</div>
				
				{/* Range Grid */}
				<div className="mb-4 flex justify-center">
					<RangeGrid
						selectedHands={currentRange}
						onHandToggle={handleHandToggle}
						readonly={!isEditing}
					/>
				</div>
				
				{/* Edit Controls */}
				{isEditing && (
					<div className="mb-4 flex justify-center space-x-2">
						<Button variant="outline" size="sm" onClick={handleCancel}>
							Cancel
						</Button>
						<Button size="sm" onClick={handleSave}>
							Save Changes
						</Button>
					</div>
				)}
				
				{/* Range Summary */}
				<div className="grid grid-cols-3 gap-3 text-center text-xs mb-4">
					<div className="p-2 bg-red-50 rounded border border-red-200">
						<div className="font-bold text-red-700">
							{stats.premium.toFixed(1)}%
						</div>
						<div className="text-red-600">Premium</div>
					</div>
					<div className="p-2 bg-yellow-50 rounded border border-yellow-200">
						<div className="font-bold text-yellow-700">
							{stats.playable.toFixed(1)}%
						</div>
						<div className="text-yellow-600">Playable</div>
					</div>
					<div className="p-2 bg-green-50 rounded border border-green-200">
						<div className="font-bold text-green-700">
							{stats.bluff.toFixed(1)}%
						</div>
						<div className="text-green-600">Bluffs</div>
					</div>
				</div>
				
				{/* Range Total */}
				<div className="text-center p-2 bg-blue-50 rounded border border-blue-200 mb-4">
					<div className="text-sm font-medium text-blue-700">
						Total Range: {stats.totalPercent.toFixed(1)}%
					</div>
					<div className="text-xs text-blue-600">
						{currentRange.length} hand combinations
					</div>
				</div>
				
				{/* Range Assumptions */}
				<div className="p-3 bg-gray-50 rounded-lg">
					<div className="text-xs font-medium text-gray-700 mb-1">Assumptions</div>
					<div className="text-xs text-gray-600">
						Estimated range based on position and typical playing style
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
