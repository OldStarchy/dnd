import { AccordionHeader, AccordionTrigger } from '@radix-ui/react-accordion';
import { ChevronDownIcon, Plus } from 'lucide-react';
import { useState } from 'react';

import CreatureForm from '@/components/CreatureForm';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { Collection } from '@/db/Collection';
import { LocalStorageCollection } from '@/db/LocalStorageCollection';
import {
	CreatureCollectionSchema,
	type CreatureRecordType,
} from '@/db/record/Creature';
import useCollectionQuery from '@/hooks/useCollectionQuery';
import { Db } from '@/sync/room/RoomApi';

const db = new Db<{
	creature: Collection<CreatureRecordType>;
}>({
	creature: (db) =>
		new LocalStorageCollection<CreatureRecordType>(
			CreatureCollectionSchema,
			db,
		),
});

const creatureCollection = db.get('creature');

/**
 * Allows editing of player characters.
 */
function CustomCreatureEditor() {
	const [selectedCreature, setSelectedCreature] = useState<InstanceType<
		(typeof CreatureCollectionSchema)['documentClass']
	> | null>(null);

	const creatures = useCollectionQuery(creatureCollection) ?? [];

	return (
		<ScrollArea>
			<h1 className="text-2xl font-bold mb-4">Permanent Creatures</h1>
			<p className="mb-4">
				Here you can manage recurring players and npcs.
			</p>

			<div className="space-y-4">
				<Accordion type="multiple">
					{creatures.map((creature) => (
						<AccordionItem
							value={creature.data.id}
							key={creature.data.id}
						>
							<AccordionHeader>
								<AccordionTrigger asChild>
									<Card className="w-full p-4 flex flex-row justify-start items-center [&[data-state=open]>svg]:rotate-180">
										<Avatar>
											<AvatarImage
												src={creature.data.images?.[0]}
												alt={creature.data.name}
											/>
											<AvatarFallback>
												{creature.data.name
													.replace(
														/[^a-zA-Z0-9 ]+/g,
														' ',
													)
													.replace(
														/(?:^| )(\w)\w+/g,
														(_, initial: string) =>
															initial.toUpperCase(),
													)}
											</AvatarFallback>
										</Avatar>
										<h2 className="text-xl font-semibold">
											{creature.data.name}
										</h2>
										<p>
											Health: {creature.data.hp} /{' '}
											{creature.data.maxHp}
											{creature.data.hitpointsRoll
												? ` (${creature.data.hitpointsRoll})`
												: ''}
										</p>

										<ChevronDownIcon className="ml-auto text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
									</Card>
								</AccordionTrigger>
							</AccordionHeader>
							<AccordionContent className="p-4">
								<CreatureForm
									creature={creature.data}
									onSubmit={(data) => {
										creature.update({ replace: data });
									}}
									actions={
										<Button
											onClick={() => creature.delete()}
											variant="destructive"
										>
											Delete
										</Button>
									}
								/>
							</AccordionContent>
						</AccordionItem>
					))}
					<AccordionItem value="new">
						<AccordionHeader>
							<AccordionTrigger asChild>
								<Card className="w-full p-4 flex flex-row justify-start items-center [&[data-state=open]>svg]:rotate-180">
									<Avatar>
										<AvatarFallback>
											<Plus />
										</AvatarFallback>
									</Avatar>
									<h2 className="text-xl font-semibold">
										New
									</h2>
									<ChevronDownIcon className="ml-auto text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
								</Card>
							</AccordionTrigger>
						</AccordionHeader>
						<AccordionContent className="p-4">
							<CreatureForm
								creature={undefined}
								onSubmit={(record) => {
									creatureCollection.create(record);
								}}
							/>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</ScrollArea>
	);
}

export default CustomCreatureEditor;
