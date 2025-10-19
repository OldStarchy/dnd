import { filter, Subscription } from 'rxjs';
import type z from 'zod';

import type { Collection, DocumentApi } from '@/db/Collection';
import type { AnyRecordType } from '@/db/RecordType';
import exhaustiveCheck from '@/lib/exhaustiveCheck';
import createUuid from '@/lib/uuid';
import type {
	closeGet$RequestSchema,
	createRequestSchema,
	deleteRequestSchema,
	get$RequestSchema,
	getOneRequestSchema,
	getRequestSchema,
	updateRequestSchema,
} from '@/sync/db/Messages';
import type { InboundRequest } from '@/sync/message/inbound';
import type { UserMessageOfType } from '@/sync/message/raw';
import type RoomHostConnection from '@/sync/room/RoomHostConnection';
import type { MemberId } from '@/sync/room/types';

import type { Db } from '../room/RoomApi';

export class CollectionHost<
	const RecordMap extends {
		[name: string]: Collection<AnyRecordType, DocumentApi<AnyRecordType>>;
	},
> {
	readonly sources: Db<RecordMap>;
	constructor(sources: Db<RecordMap>) {
		this.sources = sources;
	}

	provide(connection: RoomHostConnection): Subscription {
		const subscription = new Subscription();

		subscription.add(
			connection.request$
				.pipe(filter((request) => request.data.type === 'db'))
				.subscribe((request) => {
					this.handleRequest(request, connection, subscription);
				}),
		);

		return subscription;
	}

	handleRequest(
		request: InboundRequest<UserMessageOfType<'request'> & { type: 'db' }>,
		connection: RoomHostConnection,
		subscription: Subscription,
	) {
		request.respond(async (): Promise<UserMessageOfType<'response'>> => {
			const { data } = request;

			switch (data.action) {
				case 'closeGet$':
					return this.#handleCloseGet$(data);
			}

			const collection = this.sources.get(data.collection);
			if (!collection) throw 'Collection not found';

			switch (data.action) {
				case 'get':
					return this.#handleGet(collection, data);

				case 'get$':
					return this.#handleGet$(
						collection,
						data,
						connection,
						request.senderId,
						subscription,
					);

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
		collection: Collection<AnyRecordType>,
		data: z.infer<typeof getRequestSchema.request>,
	): Promise<z.infer<typeof getRequestSchema.response>> {
		return {
			data: (await collection.get(data.filter))
				.values()
				.map((record) => record.data)
				.toArray(),
		};
	}

	#subscriptions = new Map<string, Subscription>();
	async #handleGet$(
		collection: Collection<AnyRecordType>,
		data: z.infer<typeof get$RequestSchema.request>,
		connection: RoomHostConnection,
		subscriberId: MemberId,
		provideSubscription: Subscription,
	): Promise<z.infer<typeof get$RequestSchema.response>> {
		const member = connection.getMember(subscriberId);

		if (member === null)
			throw new Error(
				'A subscription to a database was made but the member went missing before it could start.',
			);

		const id = createUuid();
		const subscription = collection.get$(data.filter).subscribe((items) => {
			const raw = items.values().map((item) => item.data);

			if (member.online$.closed) {
				subscription.unsubscribe();
				return;
			}

			member.notify({
				type: 'db',
				subscriptionId: id,
				items: raw.toArray(),
			});
		});

		this.#subscriptions.set(id, subscription);
		subscription.add(() => this.#subscriptions.delete(id));

		provideSubscription.add(subscription);

		return {
			subscriptionId: id,
		};
	}

	async #handleCloseGet$(
		data: z.infer<typeof closeGet$RequestSchema.request>,
	): Promise<z.infer<typeof closeGet$RequestSchema.response>> {
		this.#subscriptions.get(data.subscriptionId)?.unsubscribe();

		return null;
	}

	async #handleGetOne(
		collection: Collection<AnyRecordType>,
		data: z.infer<typeof getOneRequestSchema.request>,
	): Promise<z.infer<typeof getOneRequestSchema.response>> {
		return {
			data: await collection
				.getOne(data.filter)
				.map((doc) => doc.data)
				.unwrapOrNull(),
		};
	}

	async #handleCreate(
		collection: Collection<AnyRecordType>,
		data: z.infer<typeof createRequestSchema.request>,
	): Promise<z.infer<typeof createRequestSchema.response>> {
		return {
			data: (
				await collection
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
					.create(data.data as any)
			).data,
		};
	}

	async #handleUpdate(
		collection: Collection<AnyRecordType>,
		data: z.infer<typeof updateRequestSchema.request>,
	): Promise<z.infer<typeof updateRequestSchema.response>> {
		await collection
			.getOne({ id: data.id })
			.map((doc) => doc.update(data.changeSet));

		return null;
	}

	async #handleDelete(
		collection: Collection<AnyRecordType>,
		data: z.infer<typeof deleteRequestSchema.request>,
	): Promise<z.infer<typeof deleteRequestSchema.response>> {
		await collection.getOne({ id: data.id }).map((doc) => doc.delete());

		return null;
	}
}
