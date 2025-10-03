import { zodResolver } from '@hookform/resolvers/zod';
import { ChevronDown, Plus } from 'lucide-react';
import type { ReactNode } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { useFieldArray, useForm, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { HealthObfuscation } from '@/store/types/Entity';
import { Debuff } from '@/type/Debuff';

import colors from '../colors';
import entityPropertiesSpec, { type EntityProperties } from './schema';

function EntityPropertiesForm({
	className,
	entity,
	onChange,
	children = (
		<>
			<Fields />
			<FormMessage />
			<Actions />
		</>
	),
}: {
	className?: string;
	entity?: EntityProperties;
	onChange: (entity: EntityProperties) => void;
	children?: ReactNode;
}) {
	const form = useForm({
		resolver: zodResolver(entityPropertiesSpec),
		defaultValues: entity ?? {
			name: '',
			initiative: 0,
			images: [],
			visible: true,
			ac: 10,
			hp: 10,
			maxHp: 10,
			debuffs: [],
			obfuscateHealth: HealthObfuscation.NO,
		},
	});

	function handleSubmit(data: EntityProperties) {
		// TODO: don't return new objects unless there are changes as it triggers updates to other players
		onChange(data);
	}

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className={cn('flex flex-col space-y-2', className)}
			>
				{children}
			</form>
		</Form>
	);
}

export function Fields() {
	const form = useFormContext<EntityProperties>();
	const debuffFields = useFieldArray({
		control: form.control,
		name: 'debuffs',
	});

	return (
		<div className="flex flex-col space-y-2">
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
					render={() => (
						<FormItem className="contents">
							<FormLabel className="[grid-row-start:label]">
								Initiative
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									{...form.register('initiative', {
										valueAsNumber: true,
									})}
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
					name="ac"
					render={() => (
						<FormItem className="contents">
							<FormLabel className="[grid-row-start:label]">
								AC
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									{...form.register('ac', {
										valueAsNumber: true,
									})}
									className="[grid-row-start:field]"
								/>
							</FormControl>
							<FormMessage className="[grid-row-start:message]" />
						</FormItem>
					)}
				/>
				<FormField
					control={form.control}
					name="hp"
					render={() => (
						<FormItem className="contents">
							<FormLabel className="[grid-row-start:label]">
								Health
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									{...form.register('hp', {
										valueAsNumber: true,
									})}
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
					render={() => (
						<FormItem className="contents">
							<FormLabel className="[grid-row-start:label]">
								Max Health
							</FormLabel>
							<FormControl>
								<Input
									type="number"
									{...form.register('maxHp', {
										valueAsNumber: true,
									})}
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
								<Select {...field} onValueChange={onChange}>
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
											value={HealthObfuscation.TEXT}
										>
											Text
										</SelectItem>
										<SelectItem
											value={HealthObfuscation.HIDDEN}
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
				name="images.0"
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
						No debuffs. Click the button below to add a new debuff.
					</p>
				) : (
					<>
						<Label className="[grid-column-start:name]">Name</Label>
						<Label>Description</Label>
						<Label>Notes</Label>
						<Label>Color</Label>
						<Label />
						{debuffFields.fields.map((field, index) => (
							<Fragment key={field.id}>
								<FormField
									control={form.control}
									name={`debuffs.${index}.duration`}
									render={() => (
										<FormItem className="contents">
											<FormControl>
												<Input
													type="number"
													min={0}
													className="[grid-column-start:duration] min-w-0 w-15"
													{...form.register(
														`debuffs.${index}.duration`,
														{
															valueAsNumber: true,
														},
													)}
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
										field: { onChange, value, ...field },
									}) => (
										<FormItem className="contents">
											<FormControl>
												<Select
													value={value ?? null}
													onValueChange={onChange}
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
																	{label}
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
							<DropdownMenuLabel>Presets</DropdownMenuLabel>
							{Object.entries(Debuff).map(([id, debuff]) => (
								<DropdownMenuItem
									key={id}
									onClick={() => {
										debuffFields.append({
											...debuff,
										});
									}}
								>
									{debuff.name}
								</DropdownMenuItem>
							))}
						</DropdownMenuGroup>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		</div>
	);
}

export function Actions() {
	return (
		<>
			<Button type="submit">Save</Button>
		</>
	);
}

export default EntityPropertiesForm;
