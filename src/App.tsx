import { ThemeProvider } from '@/components/theme-provider';
import { Fullscreen, Shrink, SplitIcon } from 'lucide-react';
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type ComponentProps,
	type Dispatch,
	type ReactNode,
	type SetStateAction,
} from 'react';
import { ModeToggle } from './components/mode-toggle';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Input } from './components/ui/input';
import { Label } from './components/ui/label';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from './components/ui/resizable';
import { ScrollArea } from './components/ui/scroll-area';
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from './components/ui/table';
import { cn } from './lib/utils';

function App() {
	const [splitDirection, setSplitDirection] =
		useState<ComponentProps<typeof ResizablePanelGroup>['direction']>(
			'horizontal',
		);

	const toggleSplitDirection = useCallback(() => {
		setSplitDirection((prev) =>
			prev === 'horizontal' ? 'vertical' : 'horizontal',
		);
	}, []);

	const [data, setData] = useState<Entity[]>([
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
	]);

	const [selectedEntityId, setSelectedEntityId] = useState<string | null>(
		null,
	);
	return (
		<ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
			<Layout
				splitDirection={splitDirection}
				toggleSplitDirection={toggleSplitDirection}
			>
				{/* <div className="bg-amber-300">my stuff</div> */}
				<ResizablePanelGroup
					direction={splitDirection}
					className="flex-1 w-auto h-auto border"
				>
					<ResizablePanel defaultSize={50}>
						<ScrollArea>
							<InitiativeTable
								selectedEntityId={selectedEntityId}
								setSelectedEntityId={setSelectedEntityId}
								data={data}
							/>
						</ScrollArea>
					</ResizablePanel>
					<ResizableHandle />
					<ResizablePanel defaultSize={50} className="p-4">
						{selectedEntityId ? (
							<EntityPropertyPanel
								entity={
									data.find((e) => e.id === selectedEntityId)!
								}
								onChange={(entity) => {
									setData((prev) =>
										prev.map((e) =>
											e.id === entity.id ? entity : e,
										),
									);
								}}
							/>
						) : (
							<div className="flex items-center justify-center w-full h-full">
								<p>Select an entity to edit</p>
							</div>
						)}
					</ResizablePanel>
				</ResizablePanelGroup>
			</Layout>
		</ThemeProvider>
	);
}

type Entity = {
	initiative: number;
	name: string;
	id: string;
	health: number;
	tags: Array<{ name: string; color: string }>;
};

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

function InitiativeTable({
	data,
	selectedEntityId,
	setSelectedEntityId,
}: {
	data: Entity[];
	selectedEntityId: string | null;
	setSelectedEntityId: Dispatch<SetStateAction<string | null>>;
}) {
	const tableRef = useRef<HTMLTableElement>(null);
	const [isFullscreen, setIsFullscreen] = useState(false);

	const toggleFullscreen = useCallback(() => {
		if (tableRef.current) {
			if (document.fullscreenElement) {
				document.exitFullscreen();
			} else {
				tableRef.current.requestFullscreen();
			}
		}
	}, [tableRef]);

	useEffect(() => {
		const handleFullscreenChange = () => {
			if (document.fullscreenElement) {
				setIsFullscreen(true);
			} else {
				setIsFullscreen(false);
			}
		};
		document.addEventListener('fullscreenchange', handleFullscreenChange);
		return () => {
			document.removeEventListener(
				'fullscreenchange',
				handleFullscreenChange,
			);
		};
	}, []);

	return (
		<section ref={tableRef} className="bg-background ">
			<header className="flex items-center space-x-2 p-4">
				<h2 className="text-lg font-bold flex-1">Initiative Tracker</h2>
				<Button
					variant="outline"
					size="icon"
					className="cursor-pointer"
					onClick={toggleFullscreen}
				>
					<Fullscreen
						className={cn('h-[1.2rem] w-[1.2rem] scale-100', {
							'scale-0': isFullscreen,
						})}
					/>
					<Shrink
						className={cn(
							'absolute h-[1.2rem] w-[1.2rem] scale-0',
							{
								'scale-100': isFullscreen,
							},
						)}
					/>

					<span className="sr-only">Toggle fullscreen</span>
				</Button>
			</header>
			<main>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="pl-4">Initiative</TableHead>
							<TableHead>Player</TableHead>
							<TableHead>Health</TableHead>
							<TableHead className="pr-4" />
						</TableRow>
					</TableHeader>
					<TableBody>
						{data.map((row) => (
							<TableRow
								key={row.id}
								className={cn(
									{
										'bg-accent':
											selectedEntityId === row.id,
									},
									'cursor-pointer hover:bg-accent',
								)}
								onClick={() => setSelectedEntityId(row.id)}
							>
								<TableCell className="pl-4">
									{row.initiative}
								</TableCell>
								<TableCell>{row.name}</TableCell>
								<TableCell>{row.health}</TableCell>
								<TableCell className="pr-4">
									<div className="flex space-x-2">
										{row.tags.map((tag, index) => (
											<Badge
												className={tag.color}
												key={index}
											>
												{tag.name}
											</Badge>
										))}
									</div>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</main>
		</section>
	);
}

function Layout({
	children,
	splitDirection,
	toggleSplitDirection,
}: {
	children: ReactNode;

	splitDirection: ComponentProps<typeof ResizablePanelGroup>['direction'];
	toggleSplitDirection: () => void;
}) {
	return (
		<div className="flex flex-col items-stretch justify-center min-h-screen bg-background">
			<header className="flex items-center justify-between p-4 gap-x-4">
				<h1 className="text-2xl font-bold flex-1">My App</h1>
				<Button
					variant="outline"
					size="icon"
					className="cursor-pointer"
					onClick={toggleSplitDirection}
				>
					<SplitIcon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
					<span className="sr-only">Toggle split direction</span>
				</Button>
				<ModeToggle />
			</header>
			<main className="flex-1 p-4 grid">{children}</main>
			<footer className="flex items-center justify-between p-4">
				Footer Bro
			</footer>
		</div>
	);
}

export default App;
