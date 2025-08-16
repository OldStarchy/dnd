import z from 'zod';

export function requestSchemaFactory<Data>(schema: z.ZodSchema<Data>) {
	return z.object({
		type: z.literal('request'),
		id: z.string(),
		data: schema,
	});
}

export function responseSchemaFactory<Data>(schema: z.ZodSchema<Data>) {
	return z.discriminatedUnion('type', [
		z.object({
			type: z.literal('response'),
			id: z.string(),
			data: schema,
		}),
		z.object({
			type: z.literal('response-error'),
			id: z.string(),
			error: z.string(),
		}),
	]);
}

export function notificationSchemaFactory<Data>(schema: z.ZodSchema<Data>) {
	return z.object({
		type: z.literal('notification'),
		data: schema,
	});
}
