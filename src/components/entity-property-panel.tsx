import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { HealthObfuscation, type Entity } from '@/store/types/Entity';
import { Debuff, DebuffType } from '@/type/Debuff';
import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Plus } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { Fragment } from 'react/jsx-runtime';
import { z } from 'zod';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from './ui/dropdown-menu';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from './ui/form';
import { Label } from './ui/label';
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

const DebuffSchema = z.object({
	name: z.string().min(1, 'Name is required'),
	color: z.string().min(1, 'Color is required'),
	notes: z.string().optional(),
	description: z.string().optional(),
	duration: z.coerce
		.number()
		.int()
		.min(0, 'Duration must be a non-negative integer')
		.optional()
		.transform((val) => (val === 0 ? undefined : val)),
});

const EntityPropertySchema = z.object({
	name: z.string().min(3, 'Name must be at least 3 characters long'),
	initiative: z.coerce
		.number()
		.int()
		.min(0, 'Initiative must be a non-negative integer'),
	image: z
		.string()

		.optional()
		.transform(
			(val) => val && new URL(val, window.location.toString()).toString(),
		),
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
				debuffs: data.debuffs,
				image: data.image ?? entity.creature.image,
			},
			initiative: data.initiative ?? entity.initiative,
			obfuscateHealth: data.obfuscateHealth ?? entity.obfuscateHealth,
			visible: data.visible ?? entity.visible,
		});
	}

	const debuffFields = useFieldArray({
		control: form.control,
		name: 'debuffs',
	});

	return (
		<div className="flex flex-col space-y-2">
			<Form {...form}>
				<form
					onSubmit={form.handleSubmit(handleSubmit)}
					className="flex flex-col space-y-2"
				>
					<div className="grid grid-flow-col grid-cols-[auto_auto_1fr] grid-rows-[[label]_auto_[field]_auto_[message]_auto] gap-2">
						<FormField
							control={form.control}
							name="visible"
							render={({
								field: { value: checked, onChange, ...field },
							}) => (
								<FormItem className="contents">
									<FormLabel className="[grid-row-start:label]">
										Visible
									</FormLabel>
									<FormControl>
										<Switch
											{...field}
											className="[grid-row-start:field]"
											checked={checked}
											onCheckedChange={onChange}
										/>
									</FormControl>
									<FormMessage className="[grid-row-start:message]" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="initiative"
							render={({ field }) => (
								<FormItem className="contents">
									<FormLabel className="[grid-row-start:label]">
										Initiative
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											{...field}
											className="[grid-row-start:field]"
										/>
									</FormControl>
									<FormMessage className="[grid-row-start:message]" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem className="contents">
									<FormLabel className="[grid-row-start:label]">
										Name
									</FormLabel>
									<FormControl>
										<Input
											{...field}
											className="[grid-row-start:field]"
										/>
									</FormControl>
									<FormMessage className="[grid-row-start:message]" />
								</FormItem>
							)}
						/>
					</div>

					<div className="grid grid-flow-col grid-rows-[[label]_auto_[field]_auto_[message]_auto] gap-2">
						<FormField
							control={form.control}
							name="hp"
							render={({ field }) => (
								<FormItem className="contents">
									<FormLabel className="[grid-row-start:label]">
										Health
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											{...field}
											className="[grid-row-start:field]"
										/>
									</FormControl>
									<FormMessage className="[grid-row-start:message]" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="maxHp"
							render={({ field }) => (
								<FormItem className="contents">
									<FormLabel className="[grid-row-start:label]">
										Max Health
									</FormLabel>
									<FormControl>
										<Input
											type="number"
											{...field}
											className="[grid-row-start:field]"
										/>
									</FormControl>
									<FormMessage className="[grid-row-start:message]" />
								</FormItem>
							)}
						/>
						<FormField
							control={form.control}
							name="obfuscateHealth"
							render={({ field: { onChange, ...field } }) => (
								<FormItem className="contents">
									<FormLabel className="[grid-row-start:label]">
										Obfuscate Health
									</FormLabel>
									<FormControl>
										<Select
											{...field}
											onValueChange={onChange}
										>
											<SelectTrigger className="[grid-row-start:field]">
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
									<FormMessage className="[grid-row-start:message]" />
								</FormItem>
							)}
						/>
					</div>
					<FormField
						control={form.control}
						name="image"
						render={({ field }) => (
							<FormItem className="space-y-2">
								<FormLabel>Image URL</FormLabel>
								<FormControl>
									<Input
										type="text"
										placeholder="https://example.com/image.png"
										{...field}
									/>
								</FormControl>
								<FormMessage />
							</FormItem>
						)}
					/>
					<Label>Debuffs</Label>
					<div className="grid grid-cols-[[duration]_auto_[name]_auto_[description]_auto_[notes]_1fr_[color]_auto_[actions]_auto] align-items-stretch auto-rows-auto gap-2">
						{debuffFields.fields.length === 0 ? (
							<p className="col-span-4 text-muted-foreground">
								No debuffs. Click the button below to add a new
								debuff.
							</p>
						) : (
							<>
								<Label className="[grid-column-start:name]">
									Name
								</Label>
								<Label>Description</Label>
								<Label>Notes</Label>
								<Label>Color</Label>
								<Label />
								{debuffFields.fields.map((field, index) => (
									<Fragment key={field.id}>
										<FormField
											control={form.control}
											name={`debuffs.${index}.duration`}
											render={({ field }) => (
												<FormItem className="contents">
													<FormControl>
														<Input
															type="number"
															min={0}
															className="[grid-column-start:duration] min-w-0 w-15"
															{...field}
														/>
													</FormControl>
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`debuffs.${index}.name`}
											render={({ field }) => (
												<FormItem className="contents">
													<FormControl>
														<Input
															{...field}
															className="[grid-column-start:name]"
														/>
													</FormControl>
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`debuffs.${index}.description`}
											render={({ field }) => (
												<FormItem className="contents">
													<FormControl>
														<Input
															{...field}
															className="[grid-column-start:description]"
														/>
													</FormControl>
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`debuffs.${index}.notes`}
											render={({ field }) => (
												<FormItem className="contents">
													<FormControl>
														<Input
															{...field}
															className="[grid-column-start:notes]"
														/>
													</FormControl>
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`debuffs.${index}.color`}
											render={({
												field: {
													onChange,
													value,
													...field
												},
											}) => (
												<FormItem className="contents">
													<FormControl>
														<Select
															value={
																value ?? null
															}
															onValueChange={
																onChange
															}
															{...field}
														>
															<SelectTrigger className="w-full [grid-column-start:color]">
																<SelectValue placeholder="Select color" />
															</SelectTrigger>
															<SelectContent>
																{colors.map(
																	({
																		label,
																		...props
																	}) => (
																		<SelectItem
																			{...props}
																			key={
																				props.value
																			}
																		>
																			{
																				label
																			}
																		</SelectItem>
																	),
																)}
															</SelectContent>
														</Select>
													</FormControl>
												</FormItem>
											)}
										/>
										<Button
											variant="destructive"
											onClick={() => {
												debuffFields.remove(index);
											}}
										>
											Delete
										</Button>
										<FormField
											control={form.control}
											name={`debuffs.${index}.name`}
											render={() => (
												<FormItem className="contents">
													<FormMessage className="[grid-column-start:name]" />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`debuffs.${index}.description`}
											render={() => (
												<FormItem className="contents">
													<FormMessage className="[grid-column-start:description]" />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`debuffs.${index}.notes`}
											render={() => (
												<FormItem className="contents">
													<FormMessage className="[grid-column-start:notes]" />
												</FormItem>
											)}
										/>
										<FormField
											control={form.control}
											name={`debuffs.${index}.color`}
											render={() => (
												<FormItem className="contents">
													<FormMessage className="[grid-column-start:color]" />
												</FormItem>
											)}
										/>
									</Fragment>
								))}
							</>
						)}
					</div>
					<div className="mx-auto inline-flex items-stretch border rounded-md overflow-hidden divide-x divide-border bg-background">
						<Button
							variant="ghost"
							className="cursor-pointer rounded-none p-0"
							onClick={() => {
								debuffFields.append({
									name: '',
									color: '',
								});
							}}
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
										Presets
									</DropdownMenuLabel>
									{Object.entries(DebuffType).map(
										([id, debuff]) => (
											<DropdownMenuItem
												key={id}
												onClick={() => {
													debuffFields.append({
														...Debuff.flat(
															Debuff.of(
																id as DebuffType,
															),
														),
													});
												}}
											>
												{debuff.name}
											</DropdownMenuItem>
										),
									)}
								</DropdownMenuGroup>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
					<FormMessage />
					<Button type="submit">Save</Button>
				</form>
			</Form>
		</div>
	);
}

export default EntityPropertyPanel;
