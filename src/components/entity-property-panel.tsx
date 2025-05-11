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
import type { Entity } from '@/store/types/Entity';
import { Plus } from 'lucide-react';

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
		</>
	);
}

export default EntityPropertyPanel;
