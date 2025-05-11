import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { swapEntities } from '@/store/reducers/initiativeSlice';
import { useAppDispatch, useAppSelector } from '@/store/store';
import type { Entity } from '@/store/types/Entity';
import { Fullscreen, Shrink } from 'lucide-react';
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type Dispatch,
	type SetStateAction,
} from 'react';

function InitiativeTable({
	selectedEntityId,
	setSelectedEntityId,
	headerButtons,
	rowButtons,
	reorderable = false,
}: {
	selectedEntityId: string | null;
	setSelectedEntityId: Dispatch<SetStateAction<string | null>>;
	headerButtons?: React.ReactNode;
	rowButtons?: (entity: Entity, index: number) => React.ReactNode;
	reorderable?: boolean;
}) {
	const data = useAppSelector((state) => state.initiative.entities);
	const dispatch = useAppDispatch();
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
				dispatch(swapEntities([draggedRowIndex, index]));
				setDragRowIndex(null);
			}
		},
		[dragRowIndex, data, dispatch],
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
							<TableHead className="pl-4">Initiative</TableHead>
							<TableHead>Player</TableHead>
							<TableHead>Health</TableHead>
							<TableHead className="pr-4" />
							<TableHead className="pr-4" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((row, index) => (
							<TableRow
								key={row.id}
								className={cn(
									{
										'bg-accent':
											selectedEntityId === row.id,
									},
									'cursor-pointer hover:bg-accent',
								)}
								onClick={() => setSelectedEntityId(row.id)}
								draggable={reorderable}
								onDragStart={(e) =>
									handleDragStart(e, data.indexOf(row))
								}
								onDragOver={handleDragOver}
								onDrop={(e) => handleDrop(e, data.indexOf(row))}
								onDragEnd={handleDragEnd}
							>
								<TableCell className="pl-4">
									{row.initiative}
								</TableCell>
								<TableCell>{row.name}</TableCell>
								<TableCell>{row.health}</TableCell>
								<TableCell className="pr-4">
									<div className="flex space-x-2">
										{row.tags.map((tag, index) => (
											<Badge
												className={tag.color}
												key={index}
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
				</Table>
			</main>
		</section>
	);
}

export default InitiativeTable;
