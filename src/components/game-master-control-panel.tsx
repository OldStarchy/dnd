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
import type { Entity } from '@/store/types/Entity';
import { ExternalLink, Plus } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import EntityPropertyPanel from './entity-property-panel';
import InitiativeTable from './initiative-table';

function GameMasterControlPanel() {
	const [splitDirection] = useLocalStorage('layoutDirection', (v) =>
		v !== 'vertical' ? 'horizontal' : 'vertical',
	);

	const data = useAppSelector((state) => state.initiative.entities);
	const dispatch = useAppDispatch();

	useEffect(() => {
		dispatch(
			setDefault([
				{
					initiative: 10,
					name: 'Player 1',
					id: crypto.randomUUID(),
					health: 100,
					tags: [
						{
							name: 'Stunned',
							color: 'bg-red-500',
						},
						{
							name: 'Poisoned',
							color: 'bg-green-500',
						},
					],
				},
				{
					initiative: 20,
					name: 'Player 2',
					id: crypto.randomUUID(),
					health: 80,
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
									payload: setDefault(data),
								});
							}
						};
						chan.port1.addEventListener('message', handleInitOK);
					});
				}
				return win;
			}
		});
	}, [data]);

	const selectedEntity = data.find(
		(entity) => entity.id === selectedEntityId,
	);

	const createNewEntity = useCallback(() => {
		const newEntity: Entity = {
			initiative: 0,
			name: 'New Entity',
			id: crypto.randomUUID(),
			health: 100,
			tags: [],
		};
		dispatch(setEntity(newEntity));
		setSelectedEntityId(newEntity.id);
	}, [data]);

	return (
		<ResizablePanelGroup
			direction={splitDirection}
			className="flex-1 w-auto h-auto border"
		>
			<ResizablePanel defaultSize={50}>
				<ScrollArea>
					<InitiativeTable
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
