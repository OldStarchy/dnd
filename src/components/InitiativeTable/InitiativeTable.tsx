import { useCallback, useRef, type ReactNode } from 'react';
import {
	Table,
	TableBody,
	TableCaption,
	TableHead,
	TableHeader,
	TableRow,
} from '../ui/table';
import type { InitiativeTableEntry } from './InitiativeTableRow';
import InitiativeTableRow from './InitiativeTableRow';

export default function InitiativeTable({
	entries,
	onSwapEntities,
	actions,
	footer,
	onEntityClick,
	onToggleTurn,
	currentTurnEntityId = null,
}: {
	entries: InitiativeTableEntry[];
	onSwapEntities?: (a: number, b: number) => void;
	actions?: (entity: InitiativeTableEntry, index: number) => ReactNode;
	footer?: ReactNode;
	onEntityClick?: (entity: InitiativeTableEntry) => void;
	currentTurnEntityId?: string | null;
	onToggleTurn?: (entity: InitiativeTableEntry, pressed: boolean) => void;
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
					<TableHead className="px-4 w-0">Turn</TableHead>
					<TableHead>
						<span title="Initiative">Init.</span>
					</TableHead>
					<TableHead colSpan={2}>Name</TableHead>
					<TableHead>Race</TableHead>
					<TableHead>Health</TableHead>
					<TableHead>Debuffs</TableHead>
					<TableHead className="pr-4" />
				</TableRow>
			</TableHeader>
			<TableBody>
				{entries.map((entity, index) => (
					<InitiativeTableRow
						key={entity.id}
						entry={entity}
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
				))}
			</TableBody>
			{footer && (
				<TableCaption className="text-muted-foreground mt-4 text-sm">
					{footer}
				</TableCaption>
			)}
		</Table>
	);
}
