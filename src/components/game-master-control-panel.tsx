import { Button } from '@/components/ui/button';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import useLocalStorage from '@/hooks/useLocalStorage';
import {
	removeEntity,
	setDefault,
	setEntity,
} from '@/store/reducers/initiativeSlice';
import { setPort, useAppDispatch, useAppSelector } from '@/store/store';
import {
	getObfuscatedHealthText,
	HealthObfuscation,
	type Entity,
} from '@/store/types/Entity';
import { ExternalLink, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import EntityPropertyPanel from './entity-property-panel';
import InitiativeTable, {
	type InitiativeTableEntityView,
} from './initiative-table';

function GameMasterControlPanel() {
	const [splitDirection] = useLocalStorage('layoutDirection', (v) =>
		v !== 'vertical' ? 'horizontal' : 'vertical',
	);

	const entities = useAppSelector((state) => state.initiative.entities);
	const dispatch = useAppDispatch();

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
	}, []);

	const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
		null,
	);

	const [, setPopupWindow] = useState<Window | null>(null);

	const togglePopup = useCallback(() => {
		setPopupWindow((prev) => {
			if (prev) {
				prev.close();
				setPort(null);
				return null;
			} else {
				const win = window.open(
					'/popout',
					'popout',
					'width=800,height=600',
				);
				if (win) {
					win.opener = window;
					win.focus();
					const thisCloseHandler = () => {
						win.close();
					};
					window.addEventListener('beforeunload', thisCloseHandler);

					win.addEventListener('beforeunload', () => {
						setPort(null);
						setPopupWindow(null);
						window.removeEventListener(
							'beforeunload',
							thisCloseHandler,
						);
					});

					win.addEventListener('load', () => {
						const chan = new MessageChannel();

						win.postMessage({ type: 'INIT_PORT' }, '*', [
							chan.port2,
						]);
						chan.port1.start();
						setPort(chan.port1);

						const handleInitOK = (event: MessageEvent) => {
							if (event.data?.type === 'INIT_PORT_OK') {
								chan.port1.removeEventListener(
									'message',
									handleInitOK,
								);
								chan.port1.postMessage({
									type: 'FORWARDED_ACTION',
									payload: setDefault(entities),
								});
							}
						};
						chan.port1.addEventListener('message', handleInitOK);
					});
				}
				return win;
			}
		});
	}, [entities]);

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
	}, [entities]);

	const entitiesView: InitiativeTableEntityView[] = entities.map((entity) => {
		const ety: InitiativeTableEntityView = {
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
						selectedEntityId={selectedEntityId}
						setSelectedEntityId={setSelectedEntityId}
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
							<Button
								variant="outline"
								size="icon"
								className="cursor-pointer"
								onClick={createNewEntity}
							>
								<Plus className="h-4 w-4" />
								<span className="sr-only">Add entity</span>
							</Button>
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
