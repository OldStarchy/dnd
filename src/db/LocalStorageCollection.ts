import { type ChangeSet, applyChangeset } from '@/lib/changeSet';
import { BehaviorSubject, Subject } from 'rxjs';
import type { ZodType as ZodSchema } from 'zod';
import type { Collection, CollectionPrivate, DocumentApi } from './Collection';

export class LocalStorageCollection<
	T extends { id: string; revision: number },
	TFilter,
> implements Collection<T, TFilter>
{
	readonly name: string;
	private readonly storageKey: string;
	private readonly filterFn: (item: T, filter?: TFilter) => boolean;
	private readonly schema: ZodSchema<T>;

	private _change$ = new Subject<DocumentApi<T>>();
	readonly change$ = this._change$.asObservable();

	private readonly records: Map<string, WeakRef<DocumentApiImpl<T>>>;

	constructor(
		name: string,
		filterFn: (item: T, filter?: TFilter) => boolean,
		schema: ZodSchema<T>,
	) {
		this.name = name;
		this.storageKey = `dnd.db.${this.name}`;
		this.filterFn = filterFn;
		this.schema = schema;

		this.records = new Map<string, WeakRef<DocumentApiImpl<T>>>();
	}

	private generateId(): string {
		return crypto.randomUUID();
	}

	private getRaw(): T[] {
		const items = localStorage.getItem(this.storageKey);
		try {
			const parsed = items ? JSON.parse(items) : [];

			if (!Array.isArray(parsed)) {
				console.log(
					`Invalid data in localStorage for key "${this.storageKey}": Expected an array but got ${typeof parsed}`,
				);

				console.log(items);
				return [];
			}

			const validItems: T[] = [];
			for (const item of parsed) {
				const parsedItem = this.schema.safeParse(item);
				if (parsedItem.success) {
					validItems.push(parsedItem.data);
				} else {
					console.error(
						`Invalid item in localStorage for key "${this.storageKey}":`,
						parsedItem.error,
					);
				}
			}

			return validItems.filter(
				(item: T | null): item is T => item !== null,
			);
		} catch (error) {
			console.error(
				`Error parsing localStorage data for key "${this.storageKey}":`,
				error,
			);
			return [];
		}
	}

	private setRaw(items: T[]): void {
		try {
			localStorage.setItem(this.storageKey, JSON.stringify(items));
		} catch (error) {
			console.error(
				`Error setting localStorage data for key "${this.storageKey}":`,
				error,
			);
		}
	}

	getNotifyOne(data: T): DocumentApi<T> {
		const id = data.id;

		const existing = this.records.get(id)?.deref();

		if (!existing) {
			const newDoc = new DocumentApiImpl<T>(
				new BehaviorSubject(data),
				this,
				this.schema,
			);
			this.records.set(id, new WeakRef(newDoc));
			return newDoc;
		}

		if (existing.data.getValue().revision !== data.revision) {
			existing.data.next(data);
			this._change$.next(existing);
		}
		return existing;
	}

	async get(filter?: TFilter): Promise<DocumentApi<T>[]> {
		const items = this.getRaw();
		return items
			.filter((item: T) => this.filterFn(item, filter))
			.map((item: T) => this.getNotifyOne(item));
	}

	async getOne(filter: TFilter): Promise<DocumentApi<T> | null> {
		const items = await this.get(filter);
		return items.length > 0 ? items[0] : null;
	}

	async create(newItem: Omit<T, 'id' | 'revision'>): Promise<DocumentApi<T>> {
		const items = this.getRaw();
		const data = {
			...newItem,
			id: this.generateId(),
			revision: 0,
		} as T;
		items.push(data);
		this.setRaw(items);

		return this.getNotifyOne(data);
	}

	__set(item: T): void {
		const records = this.getRaw();

		const existingIndex = records.findIndex((i) => i.id === item.id);
		if (existingIndex !== -1) {
			const existing = records[existingIndex];

			if (existing.revision !== item.revision) {
				throw new Error(
					`Cannot set item with id ${item.id} expected revision ${item.revision} but current revision is ${existing.revision}`,
				);
			}

			item = {
				...item,
				revision: existing.revision + 1,
			};

			records[existingIndex] = item;
		} else {
			records.push(item);
		}

		this.setRaw(records);

		const existing = this.records.get(item.id)?.deref();
		if (existing) {
			existing.data.next(item);
		}
	}

	__delete(id: string): void {
		const records = this.getRaw();
		if (!records.some((item) => item.id === id)) {
			return;
		}
		const newRecords = records.filter((item) => item.id !== id);
		this.setRaw(newRecords);

		const existing = this.records.get(id)?.deref();
		if (existing) {
			existing.data.complete();
		}
		this.records.delete(id);
	}
}
class DocumentApiImpl<T extends { id: string; revision: number }>
	implements DocumentApi<T>
{
	public readonly data: BehaviorSubject<T>;
	private readonly collection: CollectionPrivate<T>;
	private readonly schema: ZodSchema<T>;

	constructor(
		data: BehaviorSubject<T>,
		collection: CollectionPrivate<T>,
		schema: ZodSchema<T>,
	) {
		this.data = data;
		this.collection = collection;
		this.schema = schema;
	}

	async update(
		changeSet: ChangeSet<Omit<T, 'id' | 'revision'>>,
	): Promise<void> {
		const updated = applyChangeset(this.data.getValue(), changeSet);

		if (updated === this.data.getValue()) {
			return; // No changes made
		}

		const parsed = this.schema.parse(updated);
		this.collection.__set(parsed);
	}

	async delete(): Promise<void> {
		this.collection.__delete(this.data.getValue().id);
	}
}
