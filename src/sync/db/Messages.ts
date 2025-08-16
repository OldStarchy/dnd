import type { AnyRecordType } from '@/db/RecordType';
import z from 'zod';

interface RequestResponse<
	Request extends z.ZodType,
	Response extends z.ZodType,
> {
	request: Request;
	response: Response;
}
function RequestResponse<Request extends z.ZodType, Response extends z.ZodType>(
	rr: RequestResponse<Request, Response>,
): RequestResponse<Request, Response> {
	return rr;
}

export const getRequestSchema = RequestResponse({
	request: z.object({
		action: z.literal('get'),
		filter: z.unknown().optional(),
	}),
	response: z.object({
		data: z.unknown().array(),
	}),
});

export const getOneRequestSchema = RequestResponse({
	request: z.object({
		action: z.literal('getOne'),
		filter: z.unknown(),
	}),
	response: z.object({
		data: z.unknown().nullable(),
	}),
});

export const createRequestSchema = RequestResponse({
	request: z.object({
		action: z.literal('create'),
		data: z.unknown(),
	}),
	response: z.object({
		data: z.unknown(),
	}),
});

export const updateRequestSchema = RequestResponse({
	request: z.object({
		action: z.literal('update'),
		id: z.string(),
		revision: z.number(),
		changeSet: z.any(),
	}),
	response: z.null(),
});

export const deleteRequestSchema = RequestResponse({
	request: z.object({
		action: z.literal('delete'),
		id: z.string(),
		revision: z.number(),
	}),
	response: z.null(),
});

export const collectionRequestSchema = z
	.discriminatedUnion('action', [
		getRequestSchema.request,
		getOneRequestSchema.request,
		createRequestSchema.request,
		updateRequestSchema.request,
		deleteRequestSchema.request,
	])
	.and(
		z.object({
			type: z.literal('db'),
			collection: z.string(),
		}),
	);

export const collectionResponseSchema = z.union([
	getRequestSchema.response,
	getOneRequestSchema.response,
	createRequestSchema.response,
	updateRequestSchema.response,
	deleteRequestSchema.response,
]);

export const collectionNotificationSchema = z.object({
	type: z.literal('db'),
	collection: z.string(),
	items: z.unknown().array(),
});

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

export type GetOneResult<RecordType extends AnyRecordType> = {
	data: RecordType['record'] | null;
};

export type GetResult<RecordType extends AnyRecordType> = {
	data: RecordType['record'][];
};

export type CreateResult<RecordType extends AnyRecordType> = {
	data: RecordType['record'];
};

export type SuccessResult = null;

export function createCollectionResponseSchema<TRecord>(
	schema: z.ZodType<TRecord>,
) {
	return z.union([
		z.object({
			data: schema.nullable(),
		}),
		z.object({
			data: schema,
		}),
		z.object({
			data: z.array(schema),
		}),
		z.null(),
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
