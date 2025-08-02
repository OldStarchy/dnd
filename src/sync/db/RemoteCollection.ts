import type { Collection, DocumentApi } from '@/db/Collection';
import type { ChangeSet } from '@/lib/changeSet';
import { BehaviorSubject, filter, Subject } from 'rxjs';
import type { RemoteApi, RemoteApiConsumer } from '../RemoteApi';
import type {
	DbNotificationMessages,
	DbRequestMessages,
	DbResponseMessages,
} from './Messages';

export default class RemoteCollection<
	TName extends string,
	T extends { id: string; revision: number },
	TFilter = void,
> implements Collection<TName, T, TFilter>
{
	readonly __connection: RemoteApiConsumer<
		DbRequestMessages<TName, T>,
		DbResponseMessages<T>,
		DbNotificationMessages<T>
	>;
	readonly name: TName;

	private readonly _change$ = new Subject<DocumentApi<TName, T, TFilter>>();
	readonly change$ = this._change$.asObservable();

	private readonly records: Map<
		string,
		WeakRef<RemoteDocumentApi<TName, T, TFilter>>
	>;

	constructor(
		connection: RemoteApi<
			DbRequestMessages<TName, T>,
			DbResponseMessages<T>,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			any,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			any,
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			any,
			DbNotificationMessages<T>
		>,
		name: TName,
	) {
		this.__connection = connection;
		this.name = name;

		this.records = new Map<
			string,
			WeakRef<RemoteDocumentApi<TName, T, TFilter>>
		>();

		// TODO: there isn't a notification for deleted records yet.
		this.__connection.notification$
			.pipe(
				filter(
					(
						notification,
					): notification is typeof notification & {
						type: 'db';
						collection: string;
					} =>
						notification.type === 'db' &&
						notification.collection === this.name,
				),
			)
			.subscribe((notification) => {
				notification.items
					.map((item) => {
						return this.getNotifyOne(item);
					})
					.forEach((doc) => {
						this._change$.next(doc);
					});
			});
	}

	private getNotifyOne(data: T): DocumentApi<TName, T, TFilter> {
		const id = data.id;
		const existing = this.records.get(id)?.deref();

		if (!existing) {
			const newDoc = new RemoteDocumentApi<TName, T, TFilter>(
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

	private maybeGetOne(id: string): DocumentApi<TName, T, TFilter> | null {
		const existing = this.records.get(id)?.deref();
		if (existing) {
			return existing;
		}
		return null;
	}

	async get(filter?: TFilter): Promise<DocumentApi<TName, T, TFilter>[]> {
		const response = await this.__connection.request({
			type: 'db',
			action: 'get',
			collection: this.name,
			filter: filter,
		});

		if (response.type !== 'db' || response.action !== 'get') {
			throw new Error('Invalid response from RoomHost');
		}

		if (response.collection !== this.name) {
			throw new Error(
				`Response collection mismatch: expected ${this.name}, got ${response.collection}`,
			);
		}

		const data = response.data as T[];

		return data.map((item) => this.getNotifyOne(item));
	}

	async getOne(
		filter: TFilter,
	): Promise<DocumentApi<TName, T, TFilter> | null> {
		const cached = this.maybeGetOne(filter as unknown as string);

		// TODO: Given that changes are pushed from the host, we probably don't
		// need to proactively fetch for updates here if we have a cached item.
		const fetchPromise = (async () => {
			const response = await this.__connection.request({
				type: 'db',
				action: 'getOne',
				collection: this.name,
				filter: filter,
			});

			if (response.type !== 'db' || response.action !== 'getOne') {
				throw new Error('Invalid response from RoomHost');
			}

			if (response.collection !== this.name) {
				throw new Error(
					`Response collection mismatch: expected ${this.name}, got ${response.collection}`,
				);
			}

			if (response.data === null) {
				return null;
			}

			// TODO: Calling getOne again before previous calls complete could
			// lead to multiple notifications for the same item.
			return this.getNotifyOne(response.data as T);
		})();

		if (cached) {
			return cached;
		}

		return await fetchPromise;
	}

	async create(
		data: Omit<T, 'id' | 'revision'>,
	): Promise<DocumentApi<TName, T, TFilter>> {
		const response = await this.__connection.request({
			type: 'db',
			action: 'create',
			collection: this.name,
			data,
		} as DbRequestMessages<TName, T>);

		if (response.type !== 'db' || response.action !== 'create') {
			throw new Error('Invalid response from RoomHost');
		}

		if (response.collection !== this.name) {
			throw new Error(
				`Response collection mismatch: expected ${this.name}, got ${response.collection}`,
			);
		}

		return this.getNotifyOne(response.data as T);
	}
}

class RemoteDocumentApi<
	TName extends string,
	T extends { id: string; revision: number },
	TFilter,
> implements DocumentApi<TName, T, TFilter>
{
	readonly data: BehaviorSubject<T>;
	readonly collection: RemoteCollection<TName, T, TFilter>;

	constructor(
		data: BehaviorSubject<T>,
		collection: RemoteCollection<TName, T, TFilter>,
	) {
		this.data = data;
		this.collection = collection;
	}

	async update(
		changeSet: ChangeSet<Omit<T, 'id' | 'revision'>>,
	): Promise<void> {
		await this.collection.__connection.request({
			type: 'db',
			action: 'update',
			collection: this.collection.name,
			id: this.data.getValue().id,
			revision: this.data.getValue().revision,
			changeSet,
		});
	}

	async delete(): Promise<void> {
		await this.collection.__connection.request({
			type: 'db',
			action: 'delete',
			collection: this.collection.name,
			id: this.data.getValue().id,
			revision: this.data.getValue().revision,
		});
	}
}
