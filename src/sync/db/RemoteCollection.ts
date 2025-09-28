import { BehaviorSubject, Observable } from 'rxjs';

import type { Collection, DocumentApi } from '@/db/Collection';
import { QueryResults } from '@/db/QueryResults';
import type { AnyRecordType } from '@/db/RecordType';
import { AsyncOption } from '@/lib/AsyncOption';
import type { ChangeSet } from '@/lib/changeSet';
import filterMap, { Skip } from '@/lib/filterMap';
import { Option } from '@/lib/Option';
import type {
	CreateResult,
	DbNotificationMessages,
	DbRequestMessages,
	DbResponseMessages,
	Get$Result,
	GetOneResult,
	GetResult,
	SuccessResult,
} from '@/sync/db/Messages';
import type RoomHostConnection from '@/sync/room/RoomHostConnection';

export type RemoteCollectionMessages<T> =
	| DbRequestMessages<T>
	| DbResponseMessages<T>
	| DbNotificationMessages<T>;

export default class RemoteCollection<RecordType extends AnyRecordType = never>
	implements Collection<RecordType>
{
	private readonly records = new Map<
		string,
		WeakRef<
			InstanceType<typeof RemoteCollection.RemoteDocumentApi<RecordType>>
		>
	>();

	constructor(
		private readonly connection: RoomHostConnection,
		readonly name: string,
	) {}

	private getNotifyOne(data: RecordType['record']): DocumentApi<RecordType> {
		const id = data.id;
		const existing = this.records.get(id)?.deref();

		if (!existing) {
			const newDoc = new RemoteCollection.RemoteDocumentApi<RecordType>(
				new BehaviorSubject(data),
				this,
			);
			this.records.set(id, new WeakRef(newDoc));
			return newDoc;
		}

		if (existing.data.getValue().revision !== data.revision) {
			existing.data.next(data);
		}

		return existing;
	}

	private maybeGetOne(id: string): Option<DocumentApi<RecordType>> {
		return Option.of(this.records.get(id)?.deref());
	}

	async get(
		filter?: RecordType['filter'],
	): Promise<QueryResults<RecordType>> {
		const response = (await this.connection.gm.request({
			type: 'db',
			action: 'get',
			collection: this.name,
			filter: filter,
		})) as GetResult<RecordType>;

		const data = response.data;

		return new QueryResults(...data.map((item) => this.getNotifyOne(item)));
	}

	get$(
		filter?: RecordType['filter'],
	): Observable<ReadonlySet<DocumentApi<RecordType>>> {
		return new Observable((subscriber) => {
			const gmId = this.connection.gm.id;
			(async () => {
				const { subscriptionId } = (await this.connection.gm.request({
					type: 'db',
					action: 'get$',
					collection: this.name,
					filter: filter,
				})) as Get$Result;

				subscriber.add(() => {
					this.connection.gm.request({
						type: 'db',
						action: 'closeGet$',
						subscriptionId: subscriptionId,
					});
				});

				subscriber.add(
					this.connection.notification$
						.pipe(
							filterMap((notification) =>
								notification.data.type === 'db' &&
								notification.data.subscriptionId ===
									subscriptionId &&
								notification.senderId === gmId
									? (notification.data
											.items as RecordType['record'][])
									: Skip,
							),
						)
						.subscribe((items) => {
							subscriber.next(
								new Set(
									items.map((item) =>
										this.getNotifyOne(item),
									),
								),
							);
						}),
				);
			})();
		});
	}

	getOne(
		filter?: RecordType['filter'],
	): AsyncOption<DocumentApi<RecordType>> {
		const cached = this.maybeGetOne(filter as unknown as string);

		// TODO: Given that changes are pushed from the host, we probably don't
		// need to proactively fetch for updates here if we have a cached item.
		const fetchPromise = (async () => {
			const response = (await this.connection.gm.request({
				type: 'db',
				action: 'getOne',
				collection: this.name,
				filter: filter,
			})) as GetOneResult<RecordType>;

			if (response.data === null) {
				return null;
			}

			// TODO: Calling getOne again before previous calls complete could
			// lead to multiple notifications for the same item.
			return this.getNotifyOne(response.data as RecordType['record']);
		})();

		return cached
			.map(() => AsyncOption.Some(cached.unwrap()))
			.unwrapOrElse(() => AsyncOption.of(fetchPromise));
	}

	async create(
		data: Omit<RecordType['record'], 'id' | 'revision'>,
	): Promise<DocumentApi<RecordType>> {
		const response = (await this.connection.gm.request({
			type: 'db',
			action: 'create',
			collection: this.name,
			data,
		})) as CreateResult<RecordType>;

		return this.getNotifyOne(response.data);
	}

	async update(
		id: RecordType['record']['id'],
		revision: number,
		changeSet: ChangeSet<Omit<RecordType['record'], 'id' | 'revision'>>,
	): Promise<void> {
		(await this.connection.gm.request({
			type: 'db',
			action: 'update',
			collection: this.name,
			id,
			revision,
			changeSet,
		})) as SuccessResult;
	}

	async delete(
		id: RecordType['record']['id'],
		revision: number,
	): Promise<void> {
		await this.connection.gm.request({
			type: 'db',
			action: 'delete',
			collection: this.name,
			id,
			revision,
		});
	}

	private static RemoteDocumentApi = class RemoteDocumentApi<
		RecordType extends AnyRecordType,
	> implements DocumentApi<RecordType>
	{
		readonly data: BehaviorSubject<RecordType['record']>;

		readonly collection: RemoteCollection<RecordType>;

		constructor(
			data: BehaviorSubject<RecordType['record']>,
			collection: RemoteCollection<RecordType>,
		) {
			this.data = data;
			this.collection = collection;
		}

		async update(
			changeSet: ChangeSet<Omit<RecordType['record'], 'id' | 'revision'>>,
		): Promise<void> {
			const { id, revision } = this.data.value;
			return this.collection.update(id, revision, changeSet);
		}

		async delete(): Promise<void> {
			const { id, revision } = this.data.value;
			return this.collection.delete(id, revision);
		}
	};
}
