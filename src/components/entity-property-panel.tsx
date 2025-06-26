import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Debuff } from '@/type/Debuff';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from './ui/form';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';

const colors = [
	{ className: 'bg-red-500', value: 'bg-red-500', label: 'Red' },
	{ className: 'bg-orange-500', value: 'bg-orange-500', label: 'Orange' },
	{ className: 'bg-amber-500', value: 'bg-amber-500', label: 'Amber' },
	{ className: 'bg-yellow-500', value: 'bg-yellow-500', label: 'Yellow' },
	{ className: 'bg-lime-500', value: 'bg-lime-500', label: 'Lime' },
	{ className: 'bg-green-500', value: 'bg-green-500', label: 'Green' },
	{ className: 'bg-emerald-500', value: 'bg-emerald-500', label: 'Emerald' },
	{ className: 'bg-teal-500', value: 'bg-teal-500', label: 'Teal' },
	{ className: 'bg-cyan-500', value: 'bg-cyan-500', label: 'Cyan' },
	{ className: 'bg-sky-500', value: 'bg-sky-500', label: 'Sky' },
	{ className: 'bg-blue-500', value: 'bg-blue-500', label: 'Blue' },
	{ className: 'bg-indigo-500', value: 'bg-indigo-500', label: 'Indigo' },
	{ className: 'bg-violet-500', value: 'bg-violet-500', label: 'Violet' },
	{ className: 'bg-purple-500', value: 'bg-purple-500', label: 'Purple' },
	{ className: 'bg-fuchsia-500', value: 'bg-fuchsia-500', label: 'Fuchsia' },
	{ className: 'bg-pink-500', value: 'bg-pink-500', label: 'Pink' },
	{ className: 'bg-rose-500', value: 'bg-rose-500', label: 'Rose' },
	{
		className: 'bg-foreground text-background',
		value: 'bg-foreground',
		label: 'Black',
	},
	{
		className: 'bg-background text-foreground',
		value: 'bg-background',
		label: 'White',
	},
];

const DebuffSchema = z
	.object({
		kind: z.literal('custom'),
		name: z.string().min(1, 'Name is required'),
		color: z.string().min(1, 'Color is required'),
		notes: z.string().optional(),
		duration: z.coerce
			.number()
			.int()
			.min(0, 'Duration must be a non-negative integer')
			.optional(),
	})
	.or(
		z.object({
			kind: z.literal('preset'),
			type: z.string(),
			notes: z.string().optional(),
			duration: z.coerce
				.number()
				.int()
				.min(0, 'Duration must be a non-negative integer')
				.optional(),
		}),
	);

const EntityPropertySchema = z.object({
	name: z.string().min(3, 'Name must be at least 3 characters long'),
	initiative: z.coerce
		.number()
		.int()
		.min(0, 'Initiative must be a non-negative integer'),
	image: z.string().url().optional(),
	visible: z.boolean(),
	hp: z.coerce.number().int(),
	maxHp: z.coerce.number().int().min(1, 'Max Health must be at least 1'),
	obfuscateHealth: z.nativeEnum(HealthObfuscation),
	debuffs: z.array(DebuffSchema),
});
type EntityPropertySchema = z.infer<typeof EntityPropertySchema>;

function EntityPropertyPanel({
	entity,
	onChange,
}: {
	entity: Entity;
	onChange: (entity: Entity) => void;
}) {
	const form = useForm<EntityPropertySchema>({
		resolver: zodResolver(EntityPropertySchema),
		defaultValues: {
			name: entity.creature.name,
			initiative: entity.initiative,
			image: entity.creature.image,
			visible: entity.visible,
			hp: entity.creature.hp,
			maxHp: entity.creature.maxHp,
			obfuscateHealth: entity.obfuscateHealth,
			debuffs: entity.creature.debuffs ?? [],
		},
	});

	function handleSubmit(data: EntityPropertySchema) {
		onChange({
			...entity,
			creature: {
				...entity.creature,
				name: data.name || entity.creature.name,
				hp: data.hp ?? entity.creature.hp,
				maxHp: data.maxHp ?? entity.creature.maxHp,
				debuffs: data.debuffs as Debuff[],
			},
			initiative: data.initiative ?? entity.initiative,
			obfuscateHealth: data.obfuscateHealth ?? entity.obfuscateHealth,
			visible: data.visible ?? entity.visible,
		});
	}

	const state = form.watch();

	const debuffFields = useFieldArray({
		control: form.control,
		name: 'debuffs',
	});

	return (
		<div className="flex flex-col space-y-2">
			<pre>{JSON.stringify(state, null, 2)}</pre>
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(handleSubmit)}
					className="flex flex-col space-y-2"
				>
					<div className="flex items-stretch space-x-2">
						<FormField
							control={form.control}
							name="visible"
							render={({
								field: { value: checked, onChange, ...field },
							}) => (
								<FormItem className="space-y-2">
									<FormLabel>Visible</FormLabel>
									<FormControl>
										<Switch
											{...field}
											checked={checked}
											onCheckedChange={onChange}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="initiative"
							render={({ field }) => (
								<FormItem className="space-y-2">
									<FormLabel>Initiative</FormLabel>
									<FormControl>
										<Input type="number" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem className="space-y-2 flex-1">
									<FormLabel>Name</FormLabel>
									<FormControl>
										<Input {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid grid-flow-col grid-rows-3 auto-rows-auto gap-2">
						<FormField
							control={form.control}
							name="hp"
							render={({ field }) => (
								<FormItem className="contents">
									<FormLabel>Health</FormLabel>
									<FormControl>
										<Input type="number" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="maxHp"
							render={({ field }) => (
								<FormItem className="contents">
									<FormLabel>Max Health</FormLabel>
									<FormControl>
										<Input type="number" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="obfuscateHealth"
							render={({ field: { onChange, ...field } }) => (
								<FormItem className="contents">
									<FormLabel>Obfuscate Health</FormLabel>
									<FormControl>
										<Select
											{...field}
											onValueChange={onChange}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select obfuscation" />
											</SelectTrigger>
											<SelectContent>
												<SelectItem
													value={HealthObfuscation.NO}
												>
													None
												</SelectItem>
												<SelectItem
													value={
														HealthObfuscation.TEXT
													}
												>
													Text
												</SelectItem>
												<SelectItem
													value={
														HealthObfuscation.HIDDEN
													}
												>
													Hidden
												</SelectItem>
											</SelectContent>
										</Select>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
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
							{debuffFields.fields.map((field, index) => (
								<TableRow key={index}>
									<TableCell>
										<FormField
											control={form.control}
											name={`debuffs.${index}.name`}
											render={({
												field: { value, onChange },
											}) => (
												<Input
													value={tag.name}
													onChange={(e) => {
														onChange({
															...entity,
															creature: {
																...entity.creature,
																debuffs:
																	entity.creature.debuffs!.map(
																		(
																			tag,
																			i,
																		) =>
																			i ===
																			index
																				? {
																						...tag,
																						name: e
																							.target
																							.value,
																					}
																				: tag,
																	),
															},
														});
													}}
												/>
											)}
										/>
									</TableCell>
									<TableCell>
										<Select
											value={tag.color}
											onValueChange={(e) => {
												onChange({
													...entity,
													creature: {
														...entity.creature,
														debuffs:
															entity.creature.debuffs!.map(
																(
																	tag,
																	i,
																): Debuff =>
																	i === index
																		? {
																				...Debuff.flat(
																					tag,
																				),
																				kind: 'custom',
																				color: e,
																			}
																		: tag,
															),
													},
												});
											}}
										>
											<SelectTrigger>
												<SelectValue placeholder="Select color" />
											</SelectTrigger>
											<SelectContent>
												{colors.map(
													({ label, ...props }) => (
														<SelectItem
															{...props}
															key={props.value}
														>
															{label}
														</SelectItem>
													),
												)}
											</SelectContent>
										</Select>
									</TableCell>
									<TableCell>
										<Button
											variant="destructive"
											onClick={() => {
												const newTags = [
													...(entity.creature
														.debuffs ?? []),
												];
												newTags.splice(index, 1);
												onChange({
													...entity,
													creature: {
														...entity.creature,
														debuffs: newTags,
													},
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
									const newTags = [
										...(entity.creature.debuffs ?? []),
									];
									newTags.push({
										kind: 'custom',
										name: '',
										color: '',
									});
									onChange({
										...entity,
										creature: {
											...entity.creature,
											debuffs: newTags,
										},
									});
								}}
							>
								<Plus className="h-4 w-4" />
								<span className="sr-only">Add tag</span>
							</Button>
						</TableCaption>
					</Table>
					<Button type="submit">Save</Button>
				</form>
			</Form>
		</div>
	);
}

export default EntityPropertyPanel;
