import { useCallback, useRef, type ReactNode } from 'react';
import { Button } from '../ui/button';
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '../ui/table';
import type { InitiativeTableEntry } from './InitiativeTableRow';
import InitiativeTableRow from './InitiativeTableRow';

export default function InitiativeTable({
	entries,
	currentTurnEntityId = null,
	selectedEntityId = null,
	actions,
	footer,
	onSwapEntities,
	onEntityClick,
	onToggleTurn,
	onAdvanceTurnClick,
}: {
	entries: InitiativeTableEntry[];
	currentTurnEntityId?: string | null;
	selectedEntityId?: string | null;
	actions?: (entity: InitiativeTableEntry, index: number) => ReactNode;
	footer?: ReactNode;
	onSwapEntities?: (a: number, b: number) => void;
	onEntityClick?: (entity: InitiativeTableEntry) => void;
	onToggleTurn?: (entity: InitiativeTableEntry, pressed: boolean) => void;
	onAdvanceTurnClick?: () => void;
}) {
	const draggable = Boolean(onSwapEntities) || undefined;
	const dragFromIndex = useRef<number | null>(null);

	const handleDragStart = useCallback((index: number) => {
		return (event: React.DragEvent<HTMLTableRowElement>) => {
			dragFromIndex.current = index;
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', String(index));
		};
	}, []);

	const handleDrop = useCallback(
		(index: number) => {
			return (event: React.DragEvent<HTMLTableRowElement>) => {
				event.preventDefault();
				const dragToIndex = index;
				const dragFrom = dragFromIndex.current;
				if (dragFrom !== null && dragFrom !== dragToIndex) {
					onSwapEntities?.(dragFrom, dragToIndex);
					dragFromIndex.current = null;
				}
				event.dataTransfer.clearData();
			};
		},
		[onSwapEntities],
	);

	const handleDragOver = useCallback(
		(event: React.DragEvent<HTMLTableRowElement>) => {
			event.preventDefault();
		},
		[],
	);

	return (
		<Table>
			<TableHeader>
				<TableRow>
					<TableHead className="w-0">Turn</TableHead>
					<TableHead>
						<span title="Initiative">Init.</span>
					</TableHead>
					<TableHead colSpan={2}>Name</TableHead>
					<TableHead>Race</TableHead>
					<TableHead>Health</TableHead>
					<TableHead>Debuffs</TableHead>
					<TableHead />
				</TableRow>
			</TableHeader>
			{entries.map((entity, index) => (
				<>
					<InitiativeTableRow
						key={entity.id}
						entry={entity}
						selected={selectedEntityId === entity.id}
						draggable={draggable}
						currentTurn={currentTurnEntityId === entity.id}
						onToggleTurn={
							onToggleTurn &&
							((pressed) => onToggleTurn(entity, pressed))
						}
						onDrag={draggable && handleDragStart(index)}
						onDrop={draggable && handleDrop(index)}
						onDragOver={draggable && handleDragOver}
						actions={actions && (() => actions(entity, index))}
						onClick={onEntityClick && (() => onEntityClick(entity))}
					/>
					{entity.id === currentTurnEntityId &&
						onAdvanceTurnClick && (
							<TableBody>
								<TableRow className="hover:bg-background data-[state=selected]:bg-background">
									<TableCell
										colSpan={8}
										className="text-center"
									>
										<Button
											variant="outline"
											onClick={onAdvanceTurnClick}
										>
											Advance Turn
										</Button>
									</TableCell>
								</TableRow>
							</TableBody>
						)}
				</>
			))}
			{footer && (
				<TableCaption className="text-muted-foreground mt-4 text-sm">
					{footer}
				</TableCaption>
			)}
		</Table>
	);
}
