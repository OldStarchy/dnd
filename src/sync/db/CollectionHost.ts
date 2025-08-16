import type { Collection } from '@/db/Collection';
import type { AnyRecordType } from '@/db/RecordType';
import { filter, Subscription } from 'rxjs';
import type { InboundRequest } from '../message/inbound';
import type { UserMessageOfType } from '../message/raw';
import type RoomHostConnection from '../room/RoomHostConnection';
import { DbChangeNotification } from './message/notification';

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
					return {
						data: (await collection.get(data.action)).toRaw(),
					};

				case 'getOne':
					return {
						data: await collection
							.getOne(data.filter)
							.map((doc) => doc.data.getValue())
							.unwrapOrNull(),
					};

				case 'create':
					return {
						data: (
							await collection
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								.create(data.data as any)
						).data.getValue(),
					};

				case 'update':
					await collection
						.getOne({ id: data.id })
						.map((doc) => doc.update(data.changeSet));

					return null;

				case 'delete':
					await collection
						.getOne({ id: data.id })
						.map((doc) => doc.delete());

					return null;

				default: {
					const _exhaustiveCheck: never = data;
					throw new Error(`Unsupported action: ${data['action']}`);
				}
			}
		});
	}
}
