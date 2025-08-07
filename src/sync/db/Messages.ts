import z from 'zod';

export function createCollectionRequestSchema<TRecord>(
	name: string,
	schemaWithoutIdAndRevision: z.ZodType<TRecord>,
) {
	return z
		.union([
			z.object({
				action: z.literal('get'),
				filter: z.unknown().optional(),
			}),
			z.object({
				action: z.literal('getOne'),
				filter: z.unknown(),
			}),
			z.object({
				action: z.literal('create'),
				data: schemaWithoutIdAndRevision,
			}),
			z.object({
				action: z.literal('update'),
				id: z.string(),
				revision: z.number(),
				changeSet: z.any(),
			}),
			z.object({
				action: z.literal('delete'),
				id: z.string(),
				revision: z.number(),
			}),
		])
		.and(
			z.object({
				type: z.literal('db'),
				collection: z.literal(name),
			}),
		);
}

export function createCollectionResponseSchema<TRecord>(
	name: string,
	schema: z.ZodType<TRecord>,
) {
	return z.union([
		z.object({
			type: z.literal('db'),
			collection: z.literal(name),
			action: z.literal('getOne'),
			data: schema.nullable(),
		}),
		z.object({
			type: z.literal('db'),
			collection: z.literal(name),
			action: z.literal('create'),
			data: schema,
		}),
		z.object({
			type: z.literal('db'),
			collection: z.literal(name),
			action: z.literal('get'),
			data: z.array(schema),
		}),
	]);
}

export function createCollectionNotificationSchema<TRecord>(
	name: string,
	schema: z.ZodSchema<TRecord>,
) {
	return z.object({
		type: z.literal('db'),
		collection: z.literal(name),
		items: z.array(schema),
	});
}
export type DbRequestMessages<T> = z.infer<
	ReturnType<typeof createCollectionRequestSchema<Omit<T, 'id' | 'revision'>>>
>;

export type DbResponseMessages<T> = z.infer<
	ReturnType<typeof createCollectionResponseSchema<T>>
>;

export type DbNotificationMessages<T> = z.infer<
	ReturnType<typeof createCollectionNotificationSchema<T>>
>;
