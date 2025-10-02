import { ArrowRight, ChevronLeft } from 'lucide-react';
import {
	type ComponentPropsWithoutRef,
	type ReactNode,
	useCallback,
	useEffect,
	useState,
} from 'react';
import { Subscription } from 'rxjs';

import Debuff from '@/components/Debuff';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '@/components/ui/carousel';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Toggle } from '@/components/ui/toggle';
import type { Creature } from '@/db/record/Creature';
import useBehaviorSubject from '@/hooks/useBehaviorSubject';
import { cn } from '@/lib/utils';
import useRoomContext from '@/sync/react/context/room/useRoomContext';
import type { InitiativeTableEntryApi } from '@/type/EncounterApi';

import type { FieldVisibility } from './InitiativeTable';

export default function InitiativeTableRow({
	entry,
	actions,
	currentTurn,
	onToggleTurn,
	selected,
	fieldVisibility: vis,
	...props
}: {
	entry: InitiativeTableEntryApi;
	onToggleTurn?: (pressed: boolean) => void;
	currentTurn?: boolean;
	actions?: () => ReactNode;
	selected?: boolean;
	fieldVisibility: FieldVisibility;
} & ComponentPropsWithoutRef<typeof TableRow>) {
	const [dialogIsOpen, setDialogIsOpen] = useState(false);

	const room = useRoomContext();
	if (!room) throw new Error('Room required for initiative table');

	const getCreature = useCallback(
		(id: Creature['id']) => {
			return room.db.get('creature').getOne({ id }).unwrapOrNull();
		},
		[room],
	);

	const [creatureInfo, setCreatureInfo] = useState<Omit<
		Creature,
		'id' | 'revision'
	> | null>(null);

	const entryData = useBehaviorSubject(entry.data$);
	useEffect(() => {
		const sub = new Subscription();
		(async () => {
			if (entryData.creature.type === 'unique') {
				const id = entryData.creature.id;
				const creature = await getCreature(id);
				if (creature) {
					sub.add(
						creature.data$.subscribe((data) => {
							setCreatureInfo(data);
						}),
					);
				} else {
					console.error(`Creature with id ${id} not found.`);
				}
			} else {
				setCreatureInfo(entryData.creature.data);
			}
		})();

		return () => sub.unsubscribe();
	}, [entryData.creature, getCreature]);

	if (!creatureInfo) {
		return (
			<TableBody>
				<TableRow className="text-muted-foreground">
					<TableCell colSpan={8}>
						Loading creature information...
					</TableCell>
				</TableRow>
			</TableBody>
		);
	}

	return (
		<>
			<Collapsible defaultOpen={false} asChild>
				<TableBody className="group">
					<TableRow
						className={cn({
							'text-muted-foreground':
								entryData.effect === 'invisible',
							'bg-accent/50': selected,
						})}
						{...props}
					>
						<TableCell className="w-0 flex">
							<Toggle
								disabled={onToggleTurn === undefined}
								pressed={currentTurn}
								onPressedChange={onToggleTurn}
								onClick={(e) => e.stopPropagation()}
								variant="ghost"
								className={cn(
									'cursor-pointer opacity-0 group-hover:opacity-100',
									{
										'text-gray-700': !currentTurn,
										'opacity-100': currentTurn,
									},
								)}
							>
								<ArrowRight />
							</Toggle>
						</TableCell>
						{vis.initiative && (
							<TableCell className="w-0">
								{entryData.initiative}
							</TableCell>
						)}
						{vis.name && (
							<>
								<TableCell className="w-0">
									<Avatar>
										<AvatarImage
											src={creatureInfo.images?.[0]}
											alt={creatureInfo.name}
											className="cursor-zoom-in"
											onClick={() =>
												setDialogIsOpen(true)
											}
										/>
										<AvatarFallback>
											{creatureInfo.name
												.replace(/[^a-zA-Z0-9 ]+/g, ' ')
												.replace(
													/(?:^| )(\w)\w+/g,
													(_, initial: string) =>
														initial.toUpperCase(),
												)}
										</AvatarFallback>
									</Avatar>
								</TableCell>
								<TableCell>
									{entryData.effect === 'invisible'
										? `(${creatureInfo.name})`
										: creatureInfo.name}
								</TableCell>
							</>
						)}
						{vis.race && <TableCell>{creatureInfo.race}</TableCell>}
						{vis.ac && <TableCell>{creatureInfo.ac}</TableCell>}
						{vis.health && (
							<TableCell>{entryData.healthDisplay}</TableCell>
						)}
						{vis.debuffs && (
							<TableCell className="pr-4">
								<div className="flex space-x-2">
									{creatureInfo.debuffs?.map(
										(debuff, index) => (
											<Debuff
												debuff={{ ...debuff }}
												key={index}
											/>
										),
									)}
								</div>
							</TableCell>
						)}
						<TableCell className="flex justify-end">
							<div
								className="flex gap-1"
								onClick={(e) => e.stopPropagation()}
							>
								{creatureInfo.description &&
									vis.description && (
										<CollapsibleTrigger asChild>
											<Button
												className="group opacity-0 group-hover:opacity-100"
												variant="ghost"
												size="icon"
												aria-label="Toggle Details"
											>
												<span className="sr-only">
													Toggle Details
												</span>
												<ChevronLeft className="h-4 w-4 transition-transform duration-200 group-data-[state=open]:-rotate-90" />
											</Button>
										</CollapsibleTrigger>
									)}
								{actions?.()}
							</div>
						</TableCell>
					</TableRow>
					<CollapsibleContent asChild>
						<TableRow className="h-24">
							<TableCell colSpan={actions ? 9 : 8}>
								<CollapsibleContent asChild>
									<div className="flex gap-x-4">
										{(creatureInfo.images?.length ?? 0) >
											0 && (
											<img
												src={creatureInfo.images?.[0]}
												alt={`${creatureInfo.name} - Profile`}
												width={64}
												className="cursor-zoom-in object-contain"
												onClick={() =>
													setDialogIsOpen(true)
												}
											/>
										)}
										<div className="max-w-96">
											<p
												className={cn('text-sm', {
													'text-muted-foreground': !(
														vis.description &&
														creatureInfo.description
													),
												})}
											>
												{(vis.description &&
													creatureInfo.description) ||
													'No description available.'}
											</p>
										</div>
									</div>
								</CollapsibleContent>
							</TableCell>
						</TableRow>
					</CollapsibleContent>
				</TableBody>
			</Collapsible>
			<Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
				<DialogContent>
					<DialogHeader>{creatureInfo.name}</DialogHeader>
					{(creatureInfo.images?.length ?? 0) > 1 ? (
						<Carousel className="mx-8">
							<CarouselContent>
								{creatureInfo.images?.map((image, index) => (
									<>
										<CarouselItem key={index}>
											<img
												src={image}
												alt={creatureInfo.name}
											/>
										</CarouselItem>
									</>
								))}
							</CarouselContent>
							<CarouselPrevious />
							<CarouselNext />
						</Carousel>
					) : (
						creatureInfo.images?.[0] && (
							<img
								src={creatureInfo.images?.[0]}
								alt={creatureInfo.name}
							/>
						)
					)}
				</DialogContent>
			</Dialog>
		</>
	);
}
