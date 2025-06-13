import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { PlayerEntityView } from '@/store/types/Entity';
import { ArrowRight, Fullscreen, Shrink } from 'lucide-react';
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type ReactNode,
} from 'react';

function InitiativeTable({
	entities,
	currentTurnEntityId,
	selectedEntityId,
	onClickEntity,
	onDoubleClickEntity,
	onSwapEntities,
	headerButtons,
	rowButtons,
	reorderable = false,
	footer,
}: {
	entities: PlayerEntityView[];
	currentTurnEntityId: string | null;
	selectedEntityId: string | null;
	onClickEntity?: (id: string) => void;
	onDoubleClickEntity?: (id: string) => void;
	onSwapEntities?: (a: number, b: number) => void;
	headerButtons?: ReactNode;
	rowButtons?: (entity: PlayerEntityView, index: number) => ReactNode;
	reorderable?: boolean;
	footer?: ReactNode;
}) {
	const tableRef = useRef<HTMLTableElement>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);

	const toggleFullscreen = useCallback(() => {
		if (tableRef.current) {
			if (document.fullscreenElement) {
				document.exitFullscreen();
			} else {
				tableRef.current.requestFullscreen();
			}
		}
	}, [tableRef]);

	useEffect(() => {
		const handleFullscreenChange = () => {
			if (document.fullscreenElement) {
				setIsFullscreen(true);
			} else {
				setIsFullscreen(false);
			}
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener(
				'fullscreenchange',
				handleFullscreenChange,
			);
		};
	}, []);

	const [dragRowIndex, setDragRowIndex] = useState<number | null>(null);
	const handleDragStart = useCallback(
		(event: React.DragEvent<HTMLTableRowElement>, index: number) => {
			setDragRowIndex(index);
			event.dataTransfer.effectAllowed = 'move';
			event.dataTransfer.setData('text/plain', index.toString());
		},
		[],
	);
	const handleDragOver = useCallback(
		(event: React.DragEvent<HTMLTableRowElement>) => {
			event.preventDefault();
			event.dataTransfer.dropEffect = 'move';
		},
		[],
	);
	const handleDrop = useCallback(
		(event: React.DragEvent<HTMLTableRowElement>, index: number) => {
			event.preventDefault();
			const draggedRowIndex = dragRowIndex;
			if (draggedRowIndex !== null && draggedRowIndex !== index) {
				onSwapEntities?.(draggedRowIndex, index);
				setDragRowIndex(null);
			}
		},
		[dragRowIndex, onSwapEntities],
	);
	const handleDragEnd = useCallback(() => {
		setDragRowIndex(null);
	}, []);

	return (
		<section ref={tableRef} className="bg-background ">
			<header className="flex items-center space-x-2 p-4">
				<h2 className="text-lg font-bold flex-1">Initiative Tracker</h2>
				{headerButtons}
				<Button
					variant="outline"
					size="icon"
					className="cursor-pointer"
					onClick={toggleFullscreen}
				>
					<Fullscreen
						className={cn('h-[1.2rem] w-[1.2rem] scale-100', {
							'scale-0': isFullscreen,
						})}
					/>
					<Shrink
						className={cn(
							'absolute h-[1.2rem] w-[1.2rem] scale-0',
							{
								'scale-100': isFullscreen,
							},
						)}
					/>

					<span className="sr-only">Toggle fullscreen</span>
				</Button>
			</header>
			<main>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="pl-4 w-4 pr-0" />
							<TableHead>Initiative</TableHead>
							<TableHead>Player</TableHead>
							<TableHead>Health</TableHead>
							<TableHead />
							<TableHead className="pr-4" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{entities.map((row, index) => (
							<TableRow
								key={row.id}
								className={cn(
									{
										'bg-accent':
											selectedEntityId === row.id,
										'text-muted-foreground':
											row.effect === 'muted',
									},
									'cursor-pointer hover:bg-accent',
								)}
								onClick={() => onClickEntity?.(row.id)}
								onDoubleClick={() =>
									onDoubleClickEntity?.(row.id)
								}
								draggable={reorderable}
								onDragStart={(e) =>
									handleDragStart(e, entities.indexOf(row))
								}
								onDragOver={handleDragOver}
								onDrop={(e) =>
									handleDrop(e, entities.indexOf(row))
								}
								onDragEnd={handleDragEnd}
							>
								<TableCell className="pl-4 w-8 pr-0 text-right">
									<ArrowRight
										className={cn('h-4 w-4', {
											invisible:
												currentTurnEntityId !== row.id,
										})}
									/>
								</TableCell>
								<TableCell>{row.initiative}</TableCell>
								<TableCell>{row.name}</TableCell>
								<TableCell>{row.healthDisplay}</TableCell>
								<TableCell className="pr-4">
									<div className="flex space-x-2">
										{row.debuffs?.map((tag, index) => (
											<Badge
												className={tag.color}
												key={index}
												title={tag.notes}
											>
												{tag.name}
											</Badge>
										))}
									</div>
								</TableCell>
								<TableCell className="flex justify-end pr-4">
									{rowButtons && rowButtons(row, index)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
					{footer && (
						<TableCaption className="text-muted-foreground mt-4 text-sm">
							{footer}
						</TableCaption>
					)}
				</Table>
			</main>
		</section>
	);
}

export default InitiativeTable;
