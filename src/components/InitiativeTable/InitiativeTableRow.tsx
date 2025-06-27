import { cn } from '@/lib/utils';
import { Debuff as DebuffObj } from '@/type/Debuff';
import { ArrowRight, ChevronLeft } from 'lucide-react';
import { useState, type ComponentPropsWithoutRef, type ReactNode } from 'react';
import Debuff from '../Debuff';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
	Collapsible,
	CollapsibleContent,
	CollapsibleTrigger,
} from '../ui/collapsible';
import { Dialog, DialogContent, DialogHeader } from '../ui/dialog';
import { TableCell, TableRow } from '../ui/table';
import { Toggle } from '../ui/toggle';

export type InitiativeTableEntry = {
	id: string;
	name: string;
	race: string;
	initiative: number;
	healthDisplay: string;
	effect?: 'invisible';
	debuffs: DebuffObj[];
	description?: string;
	image?: string;
};

export default function InitiativeTableRow({
	entry,
	actions,
	currentTurn,
	onToggleTurn,
	...props
}: {
	entry: InitiativeTableEntry;
	onToggleTurn?: (pressed: boolean) => void;
	currentTurn?: boolean;
	actions?: () => ReactNode;
} & ComponentPropsWithoutRef<typeof TableRow>) {
	const [dialogIsOpen, setDialogIsOpen] = useState(false);
	return (
		<>
			<Collapsible defaultOpen={false} asChild>
				<>
					<TableRow
						className={cn({
							'text-muted-foreground':
								entry.effect === 'invisible',
						})}
						{...props}
					>
						<TableCell
							className="px-4 w-0 flex"
							onClick={(e) => e.stopPropagation()}
						>
							<Toggle
								disabled={onToggleTurn === undefined}
								pressed={currentTurn}
								onPressedChange={onToggleTurn}
								className="cursor-pointer"
							>
								<ArrowRight
									className={cn({
										'text-gray-700': !currentTurn,
									})}
								/>
							</Toggle>
						</TableCell>
						<TableCell className="w-0">
							{entry.initiative}
						</TableCell>
						<TableCell className="w-0">
							<Avatar>
								<AvatarImage
									src={entry.image}
									alt={entry.name}
									className="cursor-zoom-in"
									onClick={() => setDialogIsOpen(true)}
								/>
								<AvatarFallback>
									{entry.name
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
								? `(${entry.name})`
								: entry.name}
						</TableCell>
						<TableCell>{entry.race}</TableCell>
						<TableCell>{entry.healthDisplay}</TableCell>
						<TableCell className="pr-4">
							<div className="flex space-x-2">
								{entry.debuffs?.map((tag, index) => (
									<Debuff debuff={tag} key={index} />
								))}
							</div>
						</TableCell>
						<TableCell
							className="flex justify-end pr-4"
							onClick={(e) => e.stopPropagation()}
						>
							{actions?.()}
							{entry.description && (
								<CollapsibleTrigger asChild>
									<Button
										className="group"
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
						</TableCell>
					</TableRow>
					<CollapsibleContent asChild>
						<TableRow className="h-24">
							<TableCell colSpan={8}>
								<CollapsibleContent asChild>
									<div className="flex gap-x-4">
										{entry.image && (
											<img
												src={entry.image}
												alt={`${entry.name} - Profile`}
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
													'text-muted-foreground':
														!entry.description,
												})}
											>
												{entry.description ??
													'No description available.'}
											</p>
										</div>
									</div>
								</CollapsibleContent>
							</TableCell>
						</TableRow>
					</CollapsibleContent>
				</>
			</Collapsible>
			<Dialog open={dialogIsOpen} onOpenChange={setDialogIsOpen}>
				<DialogContent>
					<DialogHeader>{entry.name}</DialogHeader>
					<img src={entry.image} alt={entry.name} />
				</DialogContent>
			</Dialog>
		</>
	);
}
