import CreatureForm, { type CreatureFormData } from '@/components/CreatureForm';
import {
	Accordion,
	AccordionContent,
	AccordionItem,
} from '@/components/ui/accordion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import useLocalStorageCreatureList from '@/hooks/useLocalStorageCreatureList';
import { AccordionHeader, AccordionTrigger } from '@radix-ui/react-accordion';
import { ChevronDownIcon, Plus } from 'lucide-react';
import { useCallback } from 'react';

/**
 * Allows editing of player characters.
 */
function CustomCreatureEditor() {
	// TODO: useCreatureList(); for Players
	const [creatures, setCreatures] = useLocalStorageCreatureList();

	const addCreature = useCallback(
		(character: CreatureFormData) => {
			setCreatures((prev) => [
				...prev,
				{
					...character,
					id: crypto.randomUUID(),
					images: (character.images?.filter(Boolean) ??
						[]) as string[],
				},
			]);
		},
		[setCreatures],
	);

	const modifyCreature = useCallback(
		(id: string, updatedCreature: CreatureFormData) => {
			setCreatures((prev) =>
				prev.map((char) =>
					char.id === id
						? {
								...char,
								...updatedCreature,
								images: (updatedCreature.images?.filter(
									Boolean,
								) ?? []) as string[],
							}
						: char,
				),
			);
		},
		[setCreatures],
	);

	const deleteCreature = useCallback(
		(id: string) => {
			setCreatures((prev) => prev.filter((char) => char.id !== id));
		},
		[setCreatures],
	);

	return (
		<div>
			<h1 className="text-2xl font-bold mb-4">Permanent Creatures</h1>
			<p className="mb-4">
				Here you can manage recurring players and npcs.
			</p>

			<div className="space-y-4">
				<Accordion type="multiple">
					{creatures.map((creature) => (
						<AccordionItem value={creature.id} key={creature.id}>
							<AccordionHeader>
								<AccordionTrigger asChild>
									<Card className="w-full p-4 flex flex-row justify-start items-center [&[data-state=open]>svg]:rotate-180">
										<Avatar>
											<AvatarImage
												src={creature.images?.[0]}
												alt={creature.name}
											/>
											<AvatarFallback>
												{creature.name
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
											{creature.name}
										</h2>
										<p>
											Health: {creature.hp} /{' '}
											{creature.maxHp}
											{creature.hitpointsRoll
												? ` (${creature.hitpointsRoll})`
												: ''}
										</p>

										<ChevronDownIcon className="ml-auto text-muted-foreground pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200" />
									</Card>
								</AccordionTrigger>
							</AccordionHeader>
							<AccordionContent className="p-4">
								<CreatureForm
									creature={creature}
									onSubmit={(data) => {
										modifyCreature(creature.id, data);
									}}
									actions={
										<Button
											onClick={() =>
												deleteCreature(creature.id)
											}
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
								onSubmit={(data) => {
									addCreature(data);
								}}
							/>
						</AccordionContent>
					</AccordionItem>
				</Accordion>
			</div>
		</div>
	);
}

export default CustomCreatureEditor;
