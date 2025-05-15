import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Table,
	TableBody,
	TableCaption,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@/components/ui/table';
import { HealthObfuscation, type Entity } from '@/store/types/Entity';
import { Plus } from 'lucide-react';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';

function EntityPropertyPanel({
	entity,
	onChange,
}: {
	entity: Entity;
	onChange: (entity: Entity) => void;
}) {
	return (
		<div className="flex flex-col space-y-2">
			<div className="flex items-stretch space-x-2">
				<div className="space-y-2">
					<Label htmlFor="hidden">Visible</Label>
					<Switch
						id="hidden"
						checked={entity.visible}
						onCheckedChange={(e) =>
							onChange({ ...entity, visible: e })
						}
					/>
				</div>

				<div className="space-y-2">
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
				</div>

				<div className="space-y-2 flex-1">
					<Label htmlFor="name">Name</Label>
					<Input
						id="name"
						className="text-2xl"
						value={entity.name}
						onChange={(e) =>
							onChange({ ...entity, name: e.target.value })
						}
					/>
				</div>
			</div>

			<div className="grid grid-flow-col grid-rows-2 auto-rows-auto gap-2">
				<Label htmlFor="health">Health</Label>
				<Input
					id="health"
					type="number"
					value={entity.health}
					onChange={(e) =>
						onChange({
							...entity,
							health: parseInt(e.target.value),
						})
					}
				/>

				<Label htmlFor="maxHealth">Max Health</Label>
				<Input
					id="maxHealth"
					type="number"
					value={entity.maxHealth}
					onChange={(e) =>
						onChange({
							...entity,
							maxHealth: parseInt(e.target.value),
						})
					}
				/>

				<Label htmlFor="obfuscateHealth">Obfuscate Health</Label>
				<Select
					value={entity.obfuscateHealth}
					onValueChange={(e) => {
						onChange({
							...entity,
							obfuscateHealth: e as HealthObfuscation,
						});
					}}
				>
					<SelectTrigger>
						<SelectValue placeholder="Select obfuscation" />
					</SelectTrigger>
					<SelectContent>
						<SelectItem value={HealthObfuscation.NO}>
							None
						</SelectItem>
						<SelectItem value={HealthObfuscation.TEXT}>
							Text
						</SelectItem>
						<SelectItem value={HealthObfuscation.HIDDEN}>
							Hidden
						</SelectItem>
					</SelectContent>
				</Select>
			</div>
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
										onChange({
											...entity,
											tags: entity.tags.map((tag, i) =>
												i === index
													? {
															...tag,
															name: e.target
																.value,
														}
													: tag,
											),
										});
									}}
								/>
							</TableCell>
							<TableCell>
								<Select
									value={tag.color}
									onValueChange={(e) => {
										onChange({
											...entity,
											tags: entity.tags.map((tag, i) =>
												i === index
													? {
															...tag,
															color: e,
														}
													: tag,
											),
										});
									}}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select color" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem
											className="bg-red-500"
											value="bg-red-500"
										>
											Red
										</SelectItem>
										<SelectItem
											className="bg-orange-500"
											value="bg-orange-500"
										>
											Orange
										</SelectItem>
										<SelectItem
											className="bg-amber-500"
											value="bg-amber-500"
										>
											Amber
										</SelectItem>
										<SelectItem
											className="bg-yellow-500"
											value="bg-yellow-500"
										>
											Yellow
										</SelectItem>
										<SelectItem
											className="bg-lime-500"
											value="bg-lime-500"
										>
											Lime
										</SelectItem>
										<SelectItem
											className="bg-green-500"
											value="bg-green-500"
										>
											Green
										</SelectItem>
										<SelectItem
											className="bg-emerald-500"
											value="bg-emerald-500"
										>
											Emerald
										</SelectItem>
										<SelectItem
											className="bg-teal-500"
											value="bg-teal-500"
										>
											Teal
										</SelectItem>
										<SelectItem
											className="bg-cyan-500"
											value="bg-cyan-500"
										>
											Cyan
										</SelectItem>
										<SelectItem
											className="bg-sky-500"
											value="bg-sky-500"
										>
											Sky
										</SelectItem>
										<SelectItem
											className="bg-blue-500"
											value="bg-blue-500"
										>
											Blue
										</SelectItem>
										<SelectItem
											className="bg-indigo-500"
											value="bg-indigo-500"
										>
											Indigo
										</SelectItem>
										<SelectItem
											className="bg-violet-500"
											value="bg-violet-500"
										>
											Violet
										</SelectItem>
										<SelectItem
											className="bg-purple-500"
											value="bg-purple-500"
										>
											Purple
										</SelectItem>
										<SelectItem
											className="bg-fuchsia-500"
											value="bg-fuchsia-500"
										>
											Fuchsia
										</SelectItem>
										<SelectItem
											className="bg-pink-500"
											value="bg-pink-500"
										>
											Pink
										</SelectItem>
										<SelectItem
											className="bg-rose-500"
											value="bg-rose-500"
										>
											Rose
										</SelectItem>
										<SelectItem
											className="bg-foreground text-background"
											value="bg-foreground"
										>
											Black
										</SelectItem>
										<SelectItem
											className="bg-background text-foreground"
											value="bg-background"
										>
											White
										</SelectItem>
									</SelectContent>
								</Select>
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
						<TableCell colSpan={3}></TableCell>
					</TableRow>
				</TableBody>
				<TableCaption>
					<Button
						variant="outline"
						size="icon"
						className="cursor-pointer"
						onClick={() => {
							const newTags = [...entity.tags];
							newTags.push({ name: '', color: '' });
							onChange({ ...entity, tags: newTags });
						}}
					>
						<Plus className="h-4 w-4" />
						<span className="sr-only">Add tag</span>
					</Button>
				</TableCaption>
			</Table>
		</div>
	);
}

export default EntityPropertyPanel;
