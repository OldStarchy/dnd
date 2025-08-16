import { creatureSchema, type Creature } from '@/type/Creature';
import { zodResolver } from '@hookform/resolvers/zod';
import { useCallback, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import z from 'zod';
import { Button } from './ui/button';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from './ui/form';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';

const formSchema = creatureSchema.omit({
	id: true,
	revision: true,
});

export type CreatureFormData = z.infer<typeof formSchema>;

function defaultCreature(): CreatureFormData {
	return {
		name: '',
		hp: 10,
		maxHp: 10,
		images: [],
		debuffs: [],
	};
}

function CreatureForm({
	creature,
	onSubmit,
	actions,
}: {
	creature?: Creature;
	onSubmit: (data: CreatureFormData) => void;
	actions?: ReactNode;
}) {
	const form = useForm({
		resolver: zodResolver(formSchema),
		defaultValues: creature || defaultCreature(),
	});

	const handleSubmit = useCallback(
		(data: CreatureFormData) => {
			onSubmit(data);
		},
		[onSubmit],
	);

	return (
		<Form {...form}>
			<form
				onSubmit={form.handleSubmit(handleSubmit)}
				className="space-y-4 @container"
			>
				<div className="flex gap-4 flex-col @[640px]:flex-row">
					<div className="flex flex-col space-y-2 flex-1/2 flex-grow min-w-80">
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Input
											{...field}
											placeholder="Creature Name"
										/>
									</FormControl>
								</FormItem>
							)}
						/>
						<div className="flex space-x-2">
							<FormField
								control={form.control}
								name="images.0"
								render={({ field }) => (
									<FormItem className="aspect-square relative">
										{field.value && (
											<img
												className="object-cover inset-0 w-full h-full absolute"
												src={field.value}
												alt={field.value}
											/>
										)}
										<FormControl>
											<Input
												className="z-1"
												{...field}
												placeholder="Image URL"
											/>
										</FormControl>
									</FormItem>
								)}
							/>
							<div className="flex flex-col space-y-2">
								<FormField
									control={form.control}
									name="race"
									render={({ field }) => (
										<FormItem>
											<FormControl>
												<Input
													{...field}
													placeholder="Race"
												/>
											</FormControl>
										</FormItem>
									)}
								/>
								<div className="grid grid-rows-[[label]_auto_[field]_auto_[message]_auto] grid-cols-3 grid-flow-col gap-2">
									<FormField
										control={form.control}
										name="ac"
										render={({ field }) => (
											<FormItem className="contents">
												<FormLabel className="[grid-row-start:label]">
													AC
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														className="[grid-row-start:field]"
														{...field}
														placeholder="Armor Class"
													/>
												</FormControl>
												<FormMessage className="[grid-row-start:message]" />
											</FormItem>
										)}
									/>
									<FormField
										control={form.control}
										name="hp"
										render={({ field }) => (
											<FormItem className="contents">
												<FormLabel className="[grid-row-start:label]">
													HP
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														className="[grid-row-start:field]"
														{...field}
														placeholder="Hitpoints"
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
													Max
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														className="[grid-row-start:field]"
														{...field}
														placeholder="Max Hitpoints"
													/>
												</FormControl>
												<FormMessage className="[grid-row-start:message]" />
											</FormItem>
										)}
									/>
								</div>
							</div>
						</div>
						<FormField
							control={form.control}
							name="description"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Textarea
											{...field}
											placeholder="Additional notes..."
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div>Debuffs (TODO)</div>
						<Label>Speed</Label>

						<div className="grid grid-rows-[[label]_auto_[field]_auto_[message]_auto] grid-cols-3 grid-flow-col gap-2">
							<FormField
								control={form.control}
								name="speed.walk"
								render={({ field }) => (
									<FormItem className="contents">
										<FormLabel className="[grid-row-start:label]">
											Walk
										</FormLabel>
										<FormControl>
											<Input
												type="string"
												className="[grid-row-start:field]"
												{...field}
												placeholder="-"
											/>
										</FormControl>
										<FormMessage className="[grid-row-start:message]" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="speed.fly"
								render={({ field }) => (
									<FormItem className="contents">
										<FormLabel className="[grid-row-start:label]">
											Fly
										</FormLabel>
										<FormControl>
											<Input
												type="string"
												className="[grid-row-start:field]"
												{...field}
												placeholder="-"
											/>
										</FormControl>
										<FormMessage className="[grid-row-start:message]" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="speed.swim"
								render={({ field }) => (
									<FormItem className="contents">
										<FormLabel className="[grid-row-start:label]">
											Swim
										</FormLabel>
										<FormControl>
											<Input
												type="string"
												className="[grid-row-start:field]"
												{...field}
												placeholder="-"
											/>
										</FormControl>
										<FormMessage className="[grid-row-start:message]" />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="speed.other"
								render={({ field }) => (
									<FormItem className="contents">
										<FormLabel className="[grid-row-start:label]">
											Other
										</FormLabel>
										<FormControl>
											<Input
												type="string"
												className="[grid-row-start:field]"
												{...field}
												placeholder="-"
											/>
										</FormControl>
										<FormMessage className="[grid-row-start:message]" />
									</FormItem>
								)}
							/>
						</div>
					</div>
					<div className="flex flex-col space-y-2 flex-1/2 flex-grow min-w-80">
						<div className="flex justify-between">
							<Label>Attributes</Label>
							<Label>Modifiers</Label>
						</div>
						<div className="grid  grid-cols-[[label]_auto_[field]_auto_[message]_auto_[mod]_auto] gap-2">
							{[
								'strength',
								'dexterity',
								'constitution',
								'intelligence',
								'wisdom',
								'charisma',
							].map((attr) => (
								<FormField
									key={attr}
									control={form.control}
									name={
										`attributes.${attr}` as keyof CreatureFormData['attributes']
									}
									render={({ field }) => (
										<FormItem className="contents">
											<FormLabel className="[grid-column-start:label] capitalize">
												{attr
													.substring(0, 3)
													.toUpperCase()}
											</FormLabel>
											<FormControl>
												<Input
													type="number"
													className="[grid-column-start:field]"
													{...field}
													placeholder="-"
												/>
											</FormControl>
											<FormMessage className="[grid-column-start:message]" />

											<Label className="[grid-column-start:mod]">
												{Math.floor(
													(Number.parseInt(
														field.value ?? '0',
													) -
														10) /
														2,
												)
													.toString()
													.replace(/^(\d)/, '+$1')}
											</Label>
										</FormItem>
									)}
								/>
							))}
						</div>
					</div>
				</div>
				<div className="flex justify-end">
					{actions}
					<Button type="submit">
						{creature ? 'Update Creature' : 'Create Creature'}
					</Button>
				</div>
			</form>
		</Form>
	);
}

export default CreatureForm;
