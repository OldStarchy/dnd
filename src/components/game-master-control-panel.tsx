import { Button } from '@/components/ui/button';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import useCharacterPresets from '@/hooks/useCharacterPresets';
import useLocalStorage from '@/hooks/useLocalStorage';
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
import { DropdownMenuTrigger } from '@radix-ui/react-dropdown-menu';
import { addListener } from '@reduxjs/toolkit';
import { ChevronDown, ExternalLink, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import EntityPropertyPanel from './entity-property-panel';
import InitiativeTable from './initiative-table';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
} from './ui/dropdown-menu';

function reduceEntity(entity: Entity): PlayerEntityView {
	const healthDisplay = getObfuscatedHealthText(
		entity.health,
		entity.maxHealth,
		entity.obfuscateHealth,
	);

	return {
		id: entity.id,
		name: entity.name,
		initiative: entity.initiative,
		healthDisplay,
		tags: entity.tags,
	};
}

function reduceEntities(entities: Entity[]): PlayerEntityView[] {
	return entities
		.filter((entity) => entity.visible)
		.map((entity) => {
			const healthDisplay = getObfuscatedHealthText(
				entity.health,
				entity.maxHealth,
				entity.obfuscateHealth,
			);

			return {
				id: entity.id,
				name: entity.name,
				initiative: entity.initiative,
				healthDisplay,
				tags: entity.tags,
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

	const [characters] = useCharacterPresets();

	useEffect(() => {
		dispatch(
			setDefault([
				{
					id: crypto.randomUUID(),
					name: 'Sybil Snow',
					visible: true,
					initiative: 10,
					health: 11,
					maxHealth: 11,
					obfuscateHealth: HealthObfuscation.NO,
					tags: [],
				},
				{
					id: crypto.randomUUID(),
					name: 'Goblin 2',
					visible: true,
					initiative: 10,
					health: 2,
					maxHealth: 7,
					obfuscateHealth: HealthObfuscation.TEXT,
					tags: [
						{
							name: 'Stunned',
							color: 'bg-indigo-500',
						},
					],
				},
				{
					id: crypto.randomUUID(),
					name: 'Goblin 1',
					visible: true,
					initiative: 8,
					health: 0,
					maxHealth: 7,
					obfuscateHealth: HealthObfuscation.TEXT,
					tags: [],
				},
				{
					id: crypto.randomUUID(),
					name: 'Billiam',
					visible: true,
					initiative: 9,
					health: 12,
					maxHealth: 12,
					obfuscateHealth: HealthObfuscation.TEXT,
					tags: [
						{
							name: 'Poisoned',
							color: 'bg-green-500',
						},
					],
				},
				{
					id: crypto.randomUUID(),
					name: 'Sneaky Goblin',
					visible: false,
					initiative: 5,
					health: 10,
					maxHealth: 10,
					obfuscateHealth: HealthObfuscation.TEXT,
					tags: [],
				},
				{
					id: crypto.randomUUID(),
					name: 'Silence',
					visible: true,
					initiative: 3,
					health: 8,
					maxHealth: 10,
					obfuscateHealth: HealthObfuscation.NO,
					tags: [
						{
							name: 'Burned',
							color: 'bg-red-500',
						},
					],
				},
				{
					id: crypto.randomUUID(),
					name: 'Dragon',
					visible: true,
					initiative: 3,
					health: 13,
					maxHealth: 25,
					obfuscateHealth: HealthObfuscation.HIDDEN,
					tags: [],
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
			name: 'New Entity',
			visible: false,
			initiative: 0,
			health: 10,
			maxHealth: 10,
			obfuscateHealth: HealthObfuscation.NO,
			tags: [],
		};
		dispatch(setEntity(newEntity));
		setSelectedEntityId(newEntity.id);
	}, [dispatch]);

	const entitiesView: PlayerEntityView[] = entities.map((entity) => {
		const ety: PlayerEntityView = {
			initiative: entity.initiative,
			name: entity.name,
			id: entity.id,
			healthDisplay:
				`${entity.health}/${entity.maxHealth}` +
				(entity.obfuscateHealth !== HealthObfuscation.NO
					? ` (${getObfuscatedHealthText(
							entity.health,
							entity.maxHealth,
							entity.obfuscateHealth,
						)})`
					: ''),
			tags: entity.tags.map((tag) => ({
				name: tag.name,
				color: tag.color,
			})),
		};
		if (!entity.visible) {
			ety.name = `(${ety.name})`;
			ety.effect = 'muted';
		}
		return ety;
	});

	return (
		<ResizablePanelGroup
			direction={splitDirection}
			className="flex-1 w-auto h-auto border"
		>
			<ResizablePanel defaultSize={50}>
				<ScrollArea>
					<InitiativeTable
						entities={entitiesView}
						currentTurnEntityId={currentTurnEntityId}
						selectedEntityId={selectedEntityId}
						onSwapEntities={(a, b) =>
							dispatch(swapEntities([a, b]))
						}
						reorderable
						headerButtons={
							<>
								<Button
									className="ml-auto"
									variant="outline"
									size="icon"
									onClick={togglePopup}
								>
									<ExternalLink className="h-4 w-4" />
									<span className="sr-only">Open popup</span>
								</Button>
							</>
						}
						onClickEntity={setSelectedEntityId}
						onDoubleClickEntity={(id) => {
							if (id === currentTurnEntityId) {
								dispatch(setCurrentTurnEntityId(null));
							} else {
								dispatch(setCurrentTurnEntityId(id));
							}
						}}
						rowButtons={(entity) => {
							return (
								<Button
									variant="destructive"
									onClick={() => {
										dispatch(removeEntity(entity.id));
									}}
								>
									Delete
								</Button>
							);
						}}
						footer={
							<div className="inline-flex items-stretch border rounded-md overflow-hidden divide-x divide-border bg-background">
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
										{characters.length > 0 ? (
											characters.map((character) => (
												<DropdownMenuItem
													key={character.id}
													onClick={() => {
														const newEntity: Entity =
															{
																id: crypto.randomUUID(),
																name: character.name,
																visible: false,
																initiative: 0,
																health: character.health,
																maxHealth:
																	character.maxHealth,
																obfuscateHealth:
																	HealthObfuscation.NO,
																tags: [],
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
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						}
					/>
				</ScrollArea>
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel defaultSize={50} className="p-4">
				{selectedEntity ? (
					<EntityPropertyPanel
						entity={selectedEntity}
						onChange={(entity) => {
							dispatch(setEntity(entity));
						}}
					/>
				) : (
					<div className="flex items-center justify-center w-full h-full">
						<p>Select an entity to edit</p>
					</div>
				)}
			</ResizablePanel>
		</ResizablePanelGroup>
	);
}

export default GameMasterControlPanel;
