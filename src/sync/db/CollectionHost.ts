import type { Collection } from '@/db/Collection';
import type { AnyRecordType } from '@/db/RecordType';
import exhaustiveCheck from '@/lib/exhaustiveCheck';
import { filter, Subscription } from 'rxjs';
import type z from 'zod';
import type { InboundRequest } from '../message/inbound';
import type { UserMessageOfType } from '../message/raw';
import type RoomHostConnection from '../room/RoomHostConnection';
import { DbChangeNotification } from './message/notification';
import type {
	createRequestSchema,
	deleteRequestSchema,
	getOneRequestSchema,
	getRequestSchema,
	updateRequestSchema,
} from './Messages';

export class CollectionHost<
	const RecordMap extends {
		[name: string]: AnyRecordType;
	},
> {
	readonly sources: {
		[K in keyof RecordMap]?: Collection<RecordMap[K]>;
	};
	constructor(sources: { [K in keyof RecordMap]: Collection<RecordMap[K]> }) {
		this.sources = sources;
	}

	provide(connection: RoomHostConnection): Subscription {
		const subscription = new Subscription();

		Object.entries(this.sources)
			.map(([name, collection]: [string, Collection<AnyRecordType>]) => {
				return collection.change$.subscribe((doc) => {
					connection.broadcast(
						new DbChangeNotification(name, [doc.data.getValue()]),
					);
				});
			})
			.forEach((sub) => subscription.add(sub));

		const sub2 = connection.request$
			.pipe(filter((request) => request.data.type === 'db'))
			.subscribe((request) => {
				this.handleRequest(request);
			});
		subscription.add(sub2);

		return subscription;
	}

	async handleRequest(
		request: InboundRequest<UserMessageOfType<'request'> & { type: 'db' }>,
	) {
		const data = request.data;
		const collection = this.sources[data.collection];

		request.respond(async (): Promise<UserMessageOfType<'response'>> => {
			if (!collection) throw 'Collection not found';

			switch (data.action) {
				case 'get':
					return this.#handleGet(collection, data);

				case 'getOne':
					return this.#handleGetOne(collection, data);

				case 'create':
					return this.#handleCreate(collection, data);

				case 'update':
					return this.#handleUpdate(collection, data);

				case 'delete':
					return this.#handleDelete(collection, data);
			}

			exhaustiveCheck(data);
		});
	}

	async #handleGet(
		collection: Collection<RecordMap[string]>,
		data: z.infer<typeof getRequestSchema.request>,
	): Promise<z.infer<typeof getRequestSchema.response>> {
		return {
			data: (await collection.get(data.filter)).toRaw(),
		};
	}

	async #handleGetOne(
		collection: Collection<RecordMap[string]>,
		data: z.infer<typeof getOneRequestSchema.request>,
	): Promise<z.infer<typeof getOneRequestSchema.response>> {
		return {
			data: await collection
				.getOne(data.filter)
				.map((doc) => doc.data.getValue())
				.unwrapOrNull(),
		};
	}

	async #handleCreate(
		collection: Collection<RecordMap[string]>,
		data: z.infer<typeof createRequestSchema.request>,
	): Promise<z.infer<typeof createRequestSchema.response>> {
		return {
			data: (
				await collection
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.create(data.data as any)
			).data.getValue(),
		};
	}

	async #handleUpdate(
		collection: Collection<RecordMap[string]>,
		data: z.infer<typeof updateRequestSchema.request>,
	): Promise<z.infer<typeof updateRequestSchema.response>> {
		await collection
			.getOne({ id: data.id })
			.map((doc) => doc.update(data.changeSet));

		return null;
	}

	async #handleDelete(
		collection: Collection<RecordMap[string]>,
		data: z.infer<typeof deleteRequestSchema.request>,
	): Promise<z.infer<typeof deleteRequestSchema.response>> {
		await collection.getOne({ id: data.id }).map((doc) => doc.delete());

		return null;
	}
}
