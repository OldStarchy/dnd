import type { Collection, DocumentApi } from '@/db/Collection';
import type { ChangeSet } from '@/lib/changeSet';
import { BehaviorSubject, filter } from 'rxjs';
import type RoomHostConnection from './RoomHostConnection';
import type { Collections } from './RoomHostConnection';

export default class RemoteCollection<
	TName extends keyof Collections,
	TFilter = void,
> implements Collection<TName, TFilter>
{
	private readonly connection: RoomHostConnection<TName>;
	readonly name: TName;

	private readonly records: Map<string, WeakRef<RemoteDocumentApi<TName>>>;

	constructor(connection: RoomHostConnection<TName>, name: TName) {
		this.connection = connection;
		this.name = name;

		this.records = new Map<string, WeakRef<RemoteDocumentApi<TName>>>();

		this.connection.$notification
			.pipe(
				filter(
					(
						notification,
					): notification is typeof notification & {
						type: 'db';
						collection: TName;
					} =>
						notification.type === 'db' &&
						notification.collection === this.name,
				),
			)
			.subscribe((notification) => {
				notification.items.forEach((item) => {
					this.getNotifyOne(item);
				});
			});
	}

	private getNotifyOne(data: Collections[TName]): DocumentApi<TName> {
		const id = data.id;
		const existing = this.records.get(id)?.deref();

		if (!existing) {
			const newDoc = new RemoteDocumentApi<TName>(
				new BehaviorSubject(data),
				this as unknown as RemoteCollectionPrivate<TName>,
			);
			this.records.set(id, new WeakRef(newDoc));
			return newDoc;
		}

		if (existing.data.getValue().revision !== data.revision) {
			existing.data.next(data);
		}
		return existing;
	}

	private maybeGetOne(id: string): DocumentApi<TName> | null {
		const existing = this.records.get(id)?.deref();
		if (existing) {
			return existing;
		}
		return null;
	}

	async get(filter?: TFilter): Promise<DocumentApi<TName>[]> {
		const response = await this.connection.request({
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

		const data = response.data;

		return data.map((item) => this.getNotifyOne(item));
	}

	async getOne(filter: TFilter): Promise<DocumentApi<TName> | null> {
		const cached = this.maybeGetOne(filter as unknown as string);

		const fetchPromise = (async () => {
			const response = await this.connection.request({
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

			return this.getNotifyOne(response.data);
		})();

		if (cached) {
			return cached;
		}

		return await fetchPromise;
	}

	async create(
		data: Omit<Collections[TName], 'id' | 'revision'>,
	): Promise<DocumentApi<TName>> {
		const response = await this.connection.request({
			type: 'db',
			action: 'create',
			collection: this.name,
			data,
		});

		if (response.type !== 'db' || response.action !== 'create') {
			throw new Error('Invalid response from RoomHost');
		}

		if (response.collection !== this.name) {
			throw new Error(
				`Response collection mismatch: expected ${this.name}, got ${response.collection}`,
			);
		}

		return this.getNotifyOne(response.data);
	}
}

interface RemoteCollectionPrivate<TName extends keyof Collections> {
	readonly connection: RoomHostConnection<TName>;
	readonly name: TName;
}

class RemoteDocumentApi<TName extends keyof Collections>
	implements DocumentApi<TName>
{
	readonly data: BehaviorSubject<Collections[TName]>;
	private readonly collection: RemoteCollectionPrivate<TName>;

	constructor(
		data: BehaviorSubject<Collections[TName]>,
		collection: RemoteCollectionPrivate<TName>,
	) {
		this.data = data;
		this.collection = collection;
	}

	async update(
		changeSet: ChangeSet<Omit<Collections[TName], 'id' | 'revision'>>,
	): Promise<void> {
		await this.collection.connection.request({
			type: 'db',
			action: 'update',
			collection: this.collection.name,
			id: this.data.getValue().id,
			revision: this.data.getValue().revision,
			changeSet,
		});
	}

	async delete(): Promise<void> {
		await this.collection.connection.request({
			type: 'db',
			action: 'delete',
			collection: this.collection.name,
			id: this.data.getValue().id,
			revision: this.data.getValue().revision,
		});
	}
}
