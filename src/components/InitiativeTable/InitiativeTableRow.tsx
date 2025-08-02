import useCustomCreatureList from '@/hooks/useCustomCreatureList';
import { cn } from '@/lib/utils';
import { type Creature } from '@/type/Creature';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import {
	useEffect,
	useState,
	type ComponentPropsWithoutRef,
	type ReactNode,
} from 'react';
import Debuff from '../Debuff';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	CarouselNext,
	CarouselPrevious,
} from '../ui/carousel';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '../ui/collapsible';
import { Dialog, DialogContent, DialogHeader } from '../ui/dialog';
import { TableBody, TableCell, TableRow } from '../ui/table';
import { Toggle } from '../ui/toggle';
import type { FieldVisibility } from './InitiativeTable';
import type { InitiativeTableEntry } from './InitiativeTableEntry';

export default function InitiativeTableRow({
	entry,
	actions,
	currentTurn,
	onToggleTurn,
	selected,
	fieldVisibility: vis,
	...props
}: {
	entry: InitiativeTableEntry;
	onToggleTurn?: (pressed: boolean) => void;
	currentTurn?: boolean;
	actions?: () => ReactNode;
	selected?: boolean;
	fieldVisibility: FieldVisibility;
} & ComponentPropsWithoutRef<typeof TableRow>) {
	const [dialogIsOpen, setDialogIsOpen] = useState(false);
	//TODO: pull creature information from a provider, and use either a local
	// storage provider for gm or a sync provider for players
	const { get } = useCustomCreatureList();

	const [creatureInfo, setCreatureInfo] = useState<Omit<
		Creature,
		'id'
	> | null>(null);

	useEffect(() => {
		(async () => {
			if (entry.creature.type === 'unique') {
				const id = entry.creature.id;
				const creature = await get(id);
				if (creature) {
					setCreatureInfo(creature);
				} else {
					console.error(`Creature with id ${id} not found.`);
				}
			} else {
				setCreatureInfo(entry.creature.data);
			}
		})();
	}, [entry.creature, get]);

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
								entry.effect === 'invisible',
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
								{entry.initiative}
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
									{entry.effect === 'invisible'
										? `(${creatureInfo.name})`
										: creatureInfo.name}
								</TableCell>
							</>
						)}
						{vis.race && <TableCell>{creatureInfo.race}</TableCell>}
						{vis.ac && <TableCell>{creatureInfo.ac}</TableCell>}
						{vis.health && (
							<TableCell>{entry.healthDisplay}</TableCell>
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
							<TableCell colSpan={8}>
								<CollapsibleContent asChild>
									<div className="flex gap-x-4">
										{(creatureInfo.images?.length ?? 0) >
											0 && (
											<img
												src={creatureInfo.images?.[0]}
												alt={`${creatureInfo.name} - Profile`}
												width={64}
												className="cursor-zoom-in"
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
