import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import useLocalStorage from '@/hooks/useLocalStorage';
import { setDefault, setEntity } from '@/store/reducers/initiativeSlice';
import { setPort, useAppDispatch, useAppSelector } from '@/store/store';
import type { Entity } from '@/store/types/Entity';
import { ExternalLink } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import InitiativeTable from './initiative-table';

function App() {
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

	const [popupWindow, setPopupWindow] = useState<Window | null>(null);

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

	return (
		<ResizablePanelGroup
			direction={splitDirection as 'horizontal' | 'vertical'}
			className="flex-1 w-auto h-auto border"
		>
			<ResizablePanel defaultSize={50}>
				<ScrollArea>
					<InitiativeTable
						selectedEntityId={selectedEntityId}
						setSelectedEntityId={setSelectedEntityId}
						data={data}
						reorderable
						headerButtons={
							<Button
								className="ml-auto"
								variant="outline"
								size="icon"
								onClick={togglePopup}
							>
								<ExternalLink className="h-4 w-4" />
								<span className="sr-only">Open popup</span>
							</Button>
						}
					/>
				</ScrollArea>
			</ResizablePanel>
			<ResizableHandle />
			<ResizablePanel defaultSize={50} className="p-4">
				{selectedEntityId ? (
					<EntityPropertyPanel
						entity={data.find((e) => e.id === selectedEntityId)!}
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

function EntityPropertyPanel({
	entity,
	onChange,
}: {
	entity: Entity;
	onChange: (entity: Entity) => void;
}) {
	return (
		<>
			<Label htmlFor="name">Name</Label>
			<Input
				id="name"
				className="text-2xl"
				value={entity.name}
				onChange={(e) => onChange({ ...entity, name: e.target.value })}
			/>
			<Label htmlFor="initiative">Initiative</Label>
			<Input
				id="initiative"
				type="number"
				value={entity.initiative}
				onChange={(e) =>
					onChange({
						...entity,
						initiative: parseInt(e.target.value),
					})
				}
			/>
			<Label htmlFor="health">Health</Label>
			<Input
				id="health"
				type="number"
				value={entity.health}
				onChange={(e) =>
					onChange({ ...entity, health: parseInt(e.target.value) })
				}
			/>
			<Table>
				<TableHeader>
					<TableRow>
						<TableHead>Tag Name</TableHead>
						<TableHead>Tag Color</TableHead>
						<TableHead />
					</TableRow>
				</TableHeader>
				<TableBody>
					{entity.tags.map((tag, index) => (
						<TableRow key={index}>
							<TableCell>
								<Input
									value={tag.name}
									onChange={(e) => {
										const newTags = [...entity.tags];
										newTags[index].name = e.target.value;
										onChange({
											...entity,
											tags: newTags,
										});
									}}
								/>
							</TableCell>
							<TableCell>
								<Input
									value={tag.color}
									onChange={(e) => {
										const newTags = [...entity.tags];
										newTags[index].color = e.target.value;
										onChange({
											...entity,
											tags: newTags,
										});
									}}
								/>
							</TableCell>
							<TableCell>
								<Button
									variant="destructive"
									onClick={() => {
										const newTags = [...entity.tags];
										newTags.splice(index, 1);
										onChange({
											...entity,
											tags: newTags,
										});
									}}
								>
									Delete
								</Button>
							</TableCell>
						</TableRow>
					))}
					<TableRow>
						<TableCell colSpan={3}>
							<Button
								onClick={() => {
									const newTags = [...entity.tags];
									newTags.push({ name: '', color: '' });
									onChange({ ...entity, tags: newTags });
								}}
							>
								Add Tag
							</Button>
						</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</>
	);
}

export default App;
