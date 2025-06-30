import sybilProfile from '@/components/InitiativeTable/fixtures/sybil_profile.png';
import { Button } from '@/components/ui/button';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dnd5eApi } from '@/generated/dnd5eapi/Dnd5eApi';
import useCustomCreatureList from '@/hooks/useCustomCreatureList';
import useLocalStorage from '@/hooks/useLocalStorage';
import useMonsterList from '@/hooks/useMonsterList';
import { usePrimaryDispatch, usePrimarySelector } from '@/store/primary-store';
import {
	removeEntity,
	setCurrentTurnEntityId,
	setDefault,
	setEntity,
	swapEntities,
} from '@/store/reducers/initiativeSlice';
import {
	actions as reducedActions,
	removeEntity as reducedRemoveEntity,
	setCurrentTurnEntityId as reducedSetCurrentTurnEntityId,
	setDefault as reducedSetDefault,
	setEntity as reducedSetEntity,
	swapEntities as reducedSwapEntities,
} from '@/store/reducers/reduced-initiative-slice';
import {
	getObfuscatedHealthText,
	HealthObfuscation,
	type Entity,
	type PlayerEntityView,
} from '@/store/types/Entity';
import { Debuff } from '@/type/Debuff';
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { addListener } from '@reduxjs/toolkit';
import { ChevronDown, Plus, Trash } from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import EntityPropertyPanel from './entity-property-panel';
import InitiativeTable from './InitiativeTable/InitiativeTable';
import type { InitiativeTableEntry } from './InitiativeTable/InitiativeTableRow';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
} from './ui/dropdown-menu';

function reduceEntity(entity: Entity): PlayerEntityView {
	const healthDisplay = getObfuscatedHealthText(
		entity.creature.hp,
		entity.creature.maxHp,
		entity.obfuscateHealth,
	);

	return {
		id: entity.id,
		name: entity.creature.name,
		initiative: entity.initiative,
		healthDisplay,
		debuffs: entity.creature.debuffs?.map(Debuff.flat),
	};
}

function reduceEntities(entities: Entity[]): PlayerEntityView[] {
	return entities
		.filter((entity) => entity.visible)
		.map((entity) => {
			const healthDisplay = getObfuscatedHealthText(
				entity.creature.hp,
				entity.creature.maxHp,
				entity.obfuscateHealth,
			);

			return {
				id: entity.id,
				name: entity.creature.name,
				initiative: entity.initiative,
				healthDisplay,
				debuffs: entity.creature.debuffs?.map(Debuff.flat),
			};
		});
}

function GameMasterControlPanel() {
	const [splitDirection] = useLocalStorage('layoutDirection', (v) =>
		v !== 'vertical' ? 'horizontal' : 'vertical',
	);

	const { entities, currentTurnEntityId } = usePrimarySelector(
		(state) => state.initiative,
	);
	const dispatch = usePrimaryDispatch();

	const [characters] = useCustomCreatureList();
	const { monsters } = useMonsterList();

	useEffect(() => {
		dispatch(
			setDefault([
				{
					id: crypto.randomUUID(),
					visible: true,
					initiative: 10,
					obfuscateHealth: HealthObfuscation.NO,

					creature: {
						id: crypto.randomUUID(),
						name: 'Sybil Snow',
						race: 'Human',
						notes: "Sybil is a cool chick who doesn't afraid of anything.",
						image: sybilProfile,
						hp: 11,
						maxHp: 11,
						debuffs: [],
					},
				},
			]),
		);
	}, [dispatch]);

	const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
		null,
	);

	const [popupWindow, setPopupWindow] = useState<Window | null>(null);

	const togglePopup = useCallback(() => {
		setPopupWindow((prev) => {
			if (prev) {
				prev.close();
				return null;
			} else {
				return window.open('/popout', 'popout', 'width=800,height=600');
			}
		});
	}, []);

	useEffect(() => {
		if (!popupWindow) return;

		const closeCheck = () => {
			if (popupWindow?.closed) {
				setPopupWindow(null);
			}
		};

		const interval = setInterval(closeCheck, 1000);

		popupWindow.focus();
		const { port1, port2 } = new MessageChannel();
		port1.start();

		let ready = false;

		const dispatchOther = (
			action: ReturnType<
				(typeof reducedActions)[keyof typeof reducedActions]
			>,
		) => {
			if (ready) {
				port1.postMessage({
					type: 'FORWARDED_ACTION',
					payload: action,
				});
			}
		};

		const unsubs = [
			dispatch(
				addListener({
					actionCreator: setEntity,
					effect: (action) =>
						dispatchOther(
							reducedSetEntity(reduceEntity(action.payload)),
						),
				}),
			),
			dispatch(
				addListener({
					actionCreator: removeEntity,
					effect: (action) => {
						dispatchOther(reducedRemoveEntity(action.payload));
					},
				}),
			),
			dispatch(
				addListener({
					actionCreator: setDefault,
					effect: (action) => {
						dispatchOther(
							reducedSetDefault(reduceEntities(action.payload)),
						);
					},
				}),
			),
			dispatch(
				addListener({
					actionCreator: swapEntities,
					effect: (action) => {
						dispatchOther(reducedSwapEntities(action.payload));
					},
				}),
			),
		];

		const handleReady = (event: MessageEvent) => {
			if (event.data?.type === 'READY') {
				port1.removeEventListener('message', handleReady);
				ready = true;
				dispatchOther(reducedSetDefault(reduceEntities(entities)));
				dispatchOther(
					reducedSetCurrentTurnEntityId(currentTurnEntityId),
				);
			}
		};
		port1.addEventListener('message', handleReady);

		popupWindow.addEventListener('load', () => {
			popupWindow.postMessage({ type: 'INIT_PORT', port: port2 }, '*', [
				port2,
			]);
		});

		return () => {
			clearInterval(interval);
			unsubs.forEach((unsub) => unsub());
		};
	}, [popupWindow, entities, currentTurnEntityId, dispatch]);

	const selectedEntity = entities.find(
		(entity) => entity.id === selectedEntityId,
	);

	const createNewEntity = useCallback(() => {
		const newEntity: Entity = {
			id: crypto.randomUUID(),
			visible: false,
			initiative: 0,
			obfuscateHealth: HealthObfuscation.NO,
			creature: {
				id: crypto.randomUUID(),
				name: 'New Entity',
				race: 'Ghost',
				hp: 10,
				maxHp: 10,
				debuffs: [],
			},
		};
		dispatch(setEntity(newEntity));
		setSelectedEntityId(newEntity.id);
	}, [dispatch]);

	const entitiesView: InitiativeTableEntry[] = useMemo(
		() =>
			entities.map((entity) => {
				const ety: InitiativeTableEntry = {
					initiative: entity.initiative,
					name: entity.creature.name,
					race: entity.creature.race,
					image: entity.creature.image,
					description: entity.creature.notes,
					id: entity.id,
					healthDisplay:
						`${entity.creature.hp}/${entity.creature.maxHp}${entity.creature.hitpointsRoll ? ` (${entity.creature.hitpointsRoll})` : ''}` +
						(entity.obfuscateHealth !== HealthObfuscation.NO
							? ` (${getObfuscatedHealthText(
									entity.creature.hp,
									entity.creature.maxHp,
									entity.obfuscateHealth,
								)})`
							: ''),
					debuffs: entity.creature.debuffs ?? [],
				};
				if (!entity.visible) {
					ety.effect = 'invisible';
				}
				return ety;
			}),
		[entities],
	);

	return (
		<ResizablePanelGroup
			direction={splitDirection}
			className="flex-1 w-auto h-auto border"
		>
			<ResizablePanel defaultSize={50}>
				<ScrollArea className="h-full">
					<InitiativeTable
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
					/>
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
										{characters.length > 0 ? (
											characters.map((character) => (
												<DropdownMenuItem
													key={character.id}
													onClick={() => {
														const newEntity: Entity =
															{
																id: crypto.randomUUID(),
																creature:
																	character,
																visible: false,
																initiative: 0,
																obfuscateHealth:
																	HealthObfuscation.NO,
															};
														dispatch(
															setEntity(
																newEntity,
															),
														);
														setSelectedEntityId(
															newEntity.id,
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
															const api =
																new Dnd5eApi();
															const result = (
																await api.api._2014MonstersDetail(
																	monster.index,
																)
															).data;
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
															const newEntity: Entity =
																{
																	id: crypto.randomUUID(),
																	visible:
																		false,
																	initiative: 0,

																	obfuscateHealth:
																		HealthObfuscation.TEXT,
																	creature: {
																		id: result.index!,
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
																		image:
																			api.baseUrl +
																			result.image,
																		hitpointsRoll:
																			result.hit_points_roll,
																		debuffs:
																			[],
																	},
																};
															dispatch(
																setEntity(
																	newEntity,
																),
															);
															setSelectedEntityId(
																newEntity.id,
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
					{selectedEntity ? (
						<div className="pl-4 pr-6 py-4">
							<EntityPropertyPanel
								entity={selectedEntity}
								key={selectedEntity.id}
								onChange={(entity) => {
									dispatch(setEntity(entity));
								}}
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

function rollDice(str: string): number {
	const [count, sides, modifier] = (() => {
		const match =
			/^(?<count>\d+)d(?<sides>\d+)(?<modifier>[+-]?\d+)?$/.exec(str);
		if (!match) {
			throw new Error(`Invalid dice format: ${str}`);
		}

		const { count, sides, modifier } = match.groups as {
			count: string;
			sides: string;
			modifier?: string;
		};
		return [
			Number(count),
			Number(sides),
			modifier ? Number(modifier) : 0,
		] as const;
	})();

	let total = 0;
	for (let i = 0; i < count; i++) {
		total += Math.floor(Math.random() * sides) + 1 + modifier;
	}
	return total;
}
export default GameMasterControlPanel;
