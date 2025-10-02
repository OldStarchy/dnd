import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { ChevronDown, Plus } from 'lucide-react';
import {
	createContext,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from 'react';

import EntityPropertiesForm from '@/components/forms/EntityProperties/Form';
import type { EntityProperties } from '@/components/forms/EntityProperties/schema';
import {
	applyEntityToInitiativeEntry,
	toEntity,
} from '@/components/forms/EntityProperties/translate';
import InitiativeTable from '@/components/InitiativeTable/InitiativeTable';
import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { DocumentApi } from '@/db/Collection';
import type { EncounterRecordType } from '@/db/record/Encounter';
import type { InitiativeTableEntryRecord } from '@/db/record/InitiativeTableEntry';
import { dnd5eApi, dnd5eApiUrl } from '@/dnd5eApi';
import useBehaviorSubject from '@/hooks/useBehaviorSubject';
import useCollectionQuery from '@/hooks/useCollectionQuery';
import useLocalStorage from '@/hooks/useLocalStorage';
import useMonsterList from '@/hooks/useMonsterList';
import rollDice from '@/lib/rollDice';
import { type Entity, HealthObfuscation } from '@/store/types/Entity';
import useRoomContext from '@/sync/react/context/room/useRoomContext';
import type RoomApi from '@/sync/room/RoomApi';
import EncounterApi from '@/type/EncounterApi';

function GameMasterControlPanel({
	room,
	encounter,
}: {
	room: RoomApi;
	encounter: DocumentApi<EncounterRecordType>;
}) {
	const [splitDirection] = useLocalStorage('layoutDirection', (v) =>
		v !== 'vertical' ? 'horizontal' : 'vertical',
	);

	const initiativeTableEntry = useCollectionQuery(
		room.db.initiativeTableEntry,
	);
	const encounterData = useBehaviorSubject(encounter.data$);
	const shareCode = useBehaviorSubject(room.code$);

	const { monsters } = useMonsterList();

	const characters = useCollectionQuery(room.db.creature);

	const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
		null,
	);

	const selectedInitiativeTableEntry = initiativeTableEntry
		?.values()
		.find((entity) => entity.data.id === selectedEntityId);

	const createNewEntity = useCallback(() => {
		const _newEntity: Entity = {
			id: crypto.randomUUID(),
			visible: false,
			initiative: 0,
			obfuscateHealth: HealthObfuscation.NO,
			creature: {
				type: 'generic',
				data: {
					name: 'New Entity',
					race: 'Ghost',
					hp: 10,
					maxHp: 10,
					debuffs: [],
					images: [],
				},
			},
		};

		// dispatch(setEntity(newEntity));
		// setSelectedEntityId(newEntity.id);
	}, []);

	// const entitiesView: InitiativeTableEntry[] = useMemo(
	// 	() =>
	// 		entities
	// 			.filter((entity) => {
	// 				if (entity.creature.type === 'unique') {
	// 					const id = entity.creature.id;
	// 					return characters.some((c) => c.id === id);
	// 				}
	// 			})
	// 			.map((entity) => {
	// 				const creature = (() => {
	// 					if (entity.creature.type === 'unique') {
	// 						const id = entity.creature.id;
	// 						return characters.find((c) => c.id === id)!;
	// 					} else return entity.creature.data;
	// 				})();
	// 				const ety: InitiativeTableEntry = {
	// 					id: entity.id,
	// 					initiative: entity.initiative,
	// 					creature: entity.creature,
	// 					healthDisplay:
	// 						`${creature.hp}/${creature.maxHp}${creature.hitpointsRoll ? ` (${creature.hitpointsRoll})` : ''}` +
	// 						(entity.obfuscateHealth !== HealthObfuscation.NO
	// 							? ` (${getObfuscatedHealthText(
	// 									creature.hp,
	// 									creature.maxHp,
	// 									entity.obfuscateHealth,
	// 								)})`
	// 							: ''),
	// 				};
	// 				if (!entity.visible) {
	// 					ety.effect = 'invisible';
	// 				}
	// 				return ety;
	// 			}),
	// 	[entities, characters],
	// );

	return (
		<ResizablePanelGroup
			direction={splitDirection}
			className="flex-1 w-auto h-auto border"
		>
			<ResizablePanel defaultSize={50}>
				<ScrollArea className="h-full">
					<Button onClick={() => alert('NYI')}>Open in Popout</Button>
					<Input type="text" value={shareCode ?? ''} readOnly />
					<EncounterView
						room={room}
						encounter={encounter}
						selectedEntityId={selectedEntityId}
						setSelectedEntityId={setSelectedEntityId}
					/>
					{/* <InitiativeTable
						fieldVisibility={{
							initiative: true,
							name: true,
							race: true,
							ac: true,
							health: true,
							debuffs: true,
							description: true,
						}}
						entries={entitiesView}
						selectedEntityId={selectedEntityId}
						onEntityClick={({ id }) => setSelectedEntityId(id)}
						currentTurnEntityId={currentTurnEntityId}
						onToggleTurn={({ id }, pressed) => {
							dispatch(
								setCurrentTurnEntityId(pressed ? id : null),
							);
						}}
						onSwapEntities={(a, b) =>
							dispatch(swapEntities([a, b]))
						}
						onAdvanceTurnClick={advanceTurn}
						actions={(entity) => (
							<Button
								variant="ghost"
								className="opacity-0 group-hover:opacity-100"
								onClick={() => {
									dispatch(removeEntity(entity.id));
								}}
							>
								<Trash />
								<span className="sr-only">Edit entity</span>
							</Button>
						)}
					/> */}
					<div className="sticky bottom-0 left-0 w-full flex justify-center p-4">
						<div className="inline-flex items-stretch border rounded-md overflow-hidden divide-x divide-border bg-background shadow shadow-black">
							<Button
								variant="ghost"
								className="cursor-pointer rounded-none p-0"
								onClick={createNewEntity}
							>
								<Plus />
								<span className="sr-only">Add entity</span>
							</Button>

							<DropdownMenu>
								<DropdownMenuTrigger asChild>
									<Button
										variant="ghost"
										size="icon"
										className="cursor-pointer rounded-none"
									>
										<ChevronDown />
									</Button>
								</DropdownMenuTrigger>
								<DropdownMenuContent>
									<DropdownMenuGroup>
										<DropdownMenuLabel>
											Players
										</DropdownMenuLabel>
										{characters && characters.size > 0 ? (
											characters
												.values()
												.map(({ data: character }) => (
													<DropdownMenuItem
														key={character.id}
														onClick={() => {
															room.db.initiativeTableEntry
																.create({
																	encounterId:
																		encounterData.id,
																	creature: {
																		type: 'unique',
																		id: character.id,
																	},
																	healthDisplay:
																		HealthObfuscation.NO,
																	initiative: 0,
																})
																.then(
																	(
																		record,
																	) => {
																		setSelectedEntityId(
																			record
																				.data
																				.id,
																		);
																	},
																);
														}}
													>
														{character.name}
													</DropdownMenuItem>
												))
										) : (
											<DropdownMenuItem disabled>
												Create some Player Character
												Presets
											</DropdownMenuItem>
										)}
									</DropdownMenuGroup>
									<DropdownMenuSeparator />
									<DropdownMenuGroup>
										<DropdownMenuLabel>
											Monsters
										</DropdownMenuLabel>
										{monsters.length > 0 ? (
											monsters.map((monster) => (
												<DropdownMenuItem
													key={monster.index}
													onClick={() => {
														(async () => {
															const {
																data: result,
															} =
																await dnd5eApi.GET(
																	'/api/2014/monsters/{index}',
																	{
																		params: {
																			path: {
																				index: monster.index,
																			},
																		},
																	},
																);
															if (!result) return;
															const hitpoints =
																result.hit_points_roll !==
																undefined
																	? Math.max(
																			rollDice(
																				result.hit_points_roll,
																			),
																			1,
																		)
																	: (result.hit_points ??
																		0);
															room.db.initiativeTableEntry
																.create({
																	encounterId:
																		encounterData.id,
																	initiative: 0,

																	healthDisplay:
																		'dead',
																	creature: {
																		type: 'generic',
																		data: {
																			name: result.name!,
																			race: result.name!,
																			hp: hitpoints,
																			maxHp: hitpoints,
																			attributes:
																				{
																					strength:
																						result.strength,
																					dexterity:
																						result.dexterity,
																					constitution:
																						result.constitution,
																					intelligence:
																						result.intelligence,
																					wisdom: result.wisdom,
																					charisma:
																						result.charisma,
																				},
																			speed: result.speed,
																			images: [
																				dnd5eApiUrl +
																					result.image,
																			],
																			hitpointsRoll:
																				result.hit_points_roll,
																			debuffs:
																				[],
																		},
																	},
																})
																.then(
																	(
																		newEntity,
																	) => {
																		setSelectedEntityId(
																			newEntity
																				.data$
																				.value
																				.id,
																		);
																	},
																);
														})();
													}}
												>
													{monster.name}
												</DropdownMenuItem>
											))
										) : (
											<DropdownMenuItem disabled>
												5e Monsters loading...
											</DropdownMenuItem>
										)}
									</DropdownMenuGroup>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					</div>
				</ScrollArea>
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel defaultSize={50}>
				<ScrollArea className="h-full">
					{selectedInitiativeTableEntry ? (
						<div className="pl-4 pr-6 py-4">
							<InitiativeTableEntryForm
								record={selectedInitiativeTableEntry}
								key={selectedInitiativeTableEntry.data.id}
							/>
						</div>
					) : (
						<div className="flex items-center justify-center w-full h-full">
							<p>Select an entity to edit</p>
						</div>
					)}
				</ScrollArea>
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}

export default GameMasterControlPanel;

function InitiativeTableEntryForm({
	record,
}: {
	record: DocumentApi<InitiativeTableEntryRecord>;
}) {
	const room = useRoomContext();

	if (!room) {
		throw new Error('No room context');
	}

	const [entity, setEntity] = useState<EntityProperties>();

	useEffect(() => {
		toEntity(record.data, room.db.creature).then(setEntity);
	}, [record, room.db.creature]);

	const saveEntityPanelChanges = useCallback(
		async (id: string, data: EntityProperties) => {
			const record = await room.db.initiativeTableEntry
				.getOne({ id })
				.unwrap('Entity not found');
			applyEntityToInitiativeEntry(record, data, room.db.creature);
		},
		[room],
	);

	if (!entity) {
		return <div>Loading...</div>;
	}

	return (
		<EntityPropertiesForm
			entity={entity}
			onChange={(data) => {
				applyEntityToInitiativeEntry(record, data, room.db.creature);
				setEntity(data);
			}}
		/>
	);
}

// function InitiativeTableWrapper() {
// 	const room = useRoomContext();

// 	if (!room) {
// 		return <div>No room</div>;
// 	}

// 	if (!encounter.ready) {
// 		return <div>Loading encounter...</div>;
// 	}

// 	if (!encounter.value) {
// 		return <div>No encounter found</div>;
// 	}

// 	return <EncounterView room={room} encounter={encounter.value} />;
// }

const EncounterContext = createContext<EncounterApi | null>(null);
function EncounterContextProvider({
	encounter,
	children,
}: {
	encounter: DocumentApi<EncounterRecordType>;
	children: ReactNode;
}) {
	const room = useRoomContext();

	const api = useMemo(() => {
		if (encounter && room) {
			return new EncounterApi(encounter, room.db);
		}

		return null;
	}, [encounter, room]);

	return (
		<EncounterContext.Provider value={api}>
			{children}
		</EncounterContext.Provider>
	);
}

function EncounterView({
	room,
	encounter,
	selectedEntityId,
	setSelectedEntityId,
}: {
	room: RoomApi;
	encounter: DocumentApi<EncounterRecordType>;
	selectedEntityId: string | null;
	setSelectedEntityId: Dispatch<SetStateAction<string | null>>;
}) {
	const encounterApi = useMemo(
		() => new EncounterApi(encounter, room.db),
		[encounter, room],
	);

	const encounterFilter = useMemo(
		() => ({
			encounterId: encounter.data.id,
		}),
		[encounter],
	);
	const entitiesSet = useCollectionQuery(
		room.db.initiativeTableEntry,
		encounterFilter,
	);
	const entities = useMemo(() => {
		return (
			entitiesSet
				?.values()
				.toArray()
				.sort((a, b) => a.data.initiative - b.data.initiative) ?? []
		);
	}, [entitiesSet]);

	const encounterData = useBehaviorSubject(encounter.data$);

	return (
		<InitiativeTable
			entries={entities.map((v) => v.data)}
			selectedEntityId={selectedEntityId}
			onEntityClick={({ id }) => setSelectedEntityId(id)}
			currentTurnEntityId={encounterData.currentTurn}
			onToggleTurn={({ id }, pressed) => {
				encounter.update({
					merge: { currentTurn: { replace: pressed ? id : null } },
				});
			}}
			fieldVisibility={{
				initiative: true,
				name: true,
				race: true,
				ac: true,
				health: true,
				debuffs: true,
				description: true,
			}}
			onAdvanceTurnClick={() => encounterApi.advanceTurn()}
		/>
	);
}
