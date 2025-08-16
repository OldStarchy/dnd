import type { Collection, DocumentApi } from '@/db/Collection';
import { QueryResults } from '@/db/QueryResults';
import type { AnyRecordType } from '@/db/RecordType';
import { AsyncOption } from '@/lib/AsyncOption';
import type { ChangeSet } from '@/lib/changeSet';
import filterMap, { Skip } from '@/lib/filterMap';
import { Option } from '@/lib/Option';
import { BehaviorSubject, Subject } from 'rxjs';
import type z from 'zod';
import type RoomHostConnection from '../room/RoomHostConnection';
import {
	type CreateResult,
	type DbNotificationMessages,
	type DbRequestMessages,
	type DbResponseMessages,
	type GetOneResult,
	type GetResult,
	type SuccessResult,
} from './Messages';

export type RemoteCollectionMessages<T> =
	| DbRequestMessages<T>
	| DbResponseMessages<T>
	| DbNotificationMessages<T>;

export default class RemoteCollection<RecordType extends AnyRecordType>
	implements Collection<RecordType>
{
	private readonly connection: RoomHostConnection;

	readonly #change$ = new Subject<DocumentApi<RecordType>>();
	readonly change$ = this.#change$.asObservable();

	private readonly records: Map<
		string,
		WeakRef<RemoteDocumentApi<RecordType>>
	>;

	constructor(
		connection: RoomHostConnection,
		readonly name: string,
		schema: z.ZodType<RecordType['record']>,
	) {
		this.connection = connection;

		this.records = new Map<
			string,
			WeakRef<RemoteDocumentApi<RecordType>>
		>();

		const arraySchema = schema.array();

		// TODO: there isn't a notification for deleted records yet.
		this.connection.notification$
			.pipe(
				filterMap((notification) => {
					if (notification.data.type !== 'db') return Skip;
					if (notification.data.collection !== this.name) return Skip;

					const validation = arraySchema.safeParse(
						notification.data.items,
					);

					if (!validation.success) {
						console.warn(
							'Invalid records received from host:',
							notification.data.items,
							validation.error,
						);
						return Skip;
					}

					return validation.data;
				}),
			)
			.subscribe((items) => {
				items
					.map((item) => {
						return this.getNotifyOne(item);
					})
					.forEach((doc) => {
						this.#change$.next(doc);
					});
			});
	}

	private getNotifyOne(data: RecordType['record']): DocumentApi<RecordType> {
		const id = data.id;
		const existing = this.records.get(id)?.deref();

		if (!existing) {
			const newDoc = new RemoteDocumentApi<RecordType>(
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

	getOne(filter: RecordType['filter']): AsyncOption<DocumentApi<RecordType>> {
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
}

class RemoteDocumentApi<RecordType extends AnyRecordType>
	implements DocumentApi<RecordType>
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
		(await this.collection['connection'].gm.request({
			type: 'db',
			action: 'update',
			collection: this.collection.name,
			id: this.data.getValue().id,
			revision: this.data.getValue().revision,
			changeSet,
		})) as SuccessResult;
	}

	async delete(): Promise<void> {
		await this.collection['connection'].gm.request({
			type: 'db',
			action: 'delete',
			collection: this.collection.name,
			id: this.data.getValue().id,
			revision: this.data.getValue().revision,
		});
	}
}
