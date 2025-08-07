import type { Collection, DocumentApi } from '@/db/Collection';
import type { ChangeSet } from '@/lib/changeSet';
import { BehaviorSubject, filter, Subject } from 'rxjs';
import type { RemoteApiConsumer } from '../RemoteApi';
import type {
	DbNotificationMessages,
	DbRequestMessages,
	DbResponseMessages,
} from './Messages';

export default class RemoteCollection<
	T extends { id: string; revision: number },
	TFilter = void,
> implements Collection<T, TFilter>
{
	readonly __connection: RemoteApiConsumer<
		DbRequestMessages<T>,
		DbResponseMessages<T>,
		DbNotificationMessages<T>
	>;
	readonly name: string;

	private readonly _change$ = new Subject<DocumentApi<T>>();
	readonly change$ = this._change$.asObservable();

	private readonly records: Map<string, WeakRef<RemoteDocumentApi<T>>>;

	constructor(
		connection: RemoteApiConsumer<
			DbRequestMessages<T>,
			DbResponseMessages<T>,
			DbNotificationMessages<T>
		>,
		name: string,
	) {
		this.__connection = connection;
		this.name = name;

		this.records = new Map<string, WeakRef<RemoteDocumentApi<T>>>();

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

	private getNotifyOne(data: T): DocumentApi<T> {
		const id = data.id;
		const existing = this.records.get(id)?.deref();

		if (!existing) {
			const newDoc = new RemoteDocumentApi<T>(
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

	private maybeGetOne(id: string): DocumentApi<T> | null {
		const existing = this.records.get(id)?.deref();
		if (existing) {
			return existing;
		}
		return null;
	}

	async get(filter?: TFilter): Promise<DocumentApi<T>[]> {
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

	async getOne(filter: TFilter): Promise<DocumentApi<T> | null> {
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

	async create(data: Omit<T, 'id' | 'revision'>): Promise<DocumentApi<T>> {
		const response = await this.__connection.request({
			type: 'db',
			action: 'create',
			collection: this.name,
			data,
		} as DbRequestMessages<T>);

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

class RemoteDocumentApi<T extends { id: string; revision: number }>
	implements DocumentApi<T>
{
	readonly data: BehaviorSubject<T>;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	readonly collection: RemoteCollection<T, any>;

	constructor(
		data: BehaviorSubject<T>,
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		collection: RemoteCollection<T, any>,
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
