import type { Collections } from '@/sync/db/RoomHostConnection';
import { BehaviorSubject } from 'rxjs';
import type { ZodSchema } from 'zod';
import { applyChangeset, type ChangeSet } from '../lib/changeSet';

export interface Collection<TName extends keyof Collections, TFilter = void> {
	readonly name: TName;
	get(filter?: TFilter): Promise<DocumentApi<TName>[]>;
	getOne(filter: TFilter): Promise<DocumentApi<TName> | null>;
	create(newItem: Collections[TName]): Promise<DocumentApi<TName>>;
}

interface CollectionPrivate<TName extends keyof Collections> {
	__set(item: Collections[TName]): void;
	__delete(id: string): void;
}

export interface DocumentApi<TName extends keyof Collections> {
	readonly data: Omit<BehaviorSubject<Collections[TName]>, 'next'>;

	update(
		changeSet: ChangeSet<Omit<Collections[TName], 'id' | 'revision'>>,
	): Promise<void>;
	delete(): Promise<void>;
}

export class LocalStorageCollection<TName extends keyof Collections, TFilter>
	implements Collection<TName, TFilter>
{
	readonly name: TName;
	private readonly storageKey: string;
	private readonly filterFn: (
		item: Collections[TName],
		filter?: TFilter,
	) => boolean;
	private readonly schema: ZodSchema<Collections[TName]>;

	private readonly records: Map<string, WeakRef<DocumentApiImpl<TName>>>;

	constructor(
		name: TName,
		filterFn: (item: Collections[TName], filter?: TFilter) => boolean,
		schema: ZodSchema<Collections[TName]>,
	) {
		this.name = name;
		this.storageKey = `dnd.db.${this.name}`;
		this.filterFn = filterFn;
		this.schema = schema;

		this.records = new Map<string, WeakRef<DocumentApiImpl<TName>>>();
	}

	private generateId(): string {
		return crypto.randomUUID();
	}

	private getRaw(): Collections[TName][] {
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

			const validItems: Collections[TName][] = [];
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
				(item: Collections[TName] | null): item is Collections[TName] =>
					item !== null,
			);
		} catch (error) {
			console.error(
				`Error parsing localStorage data for key "${this.storageKey}":`,
				error,
			);
			return [];
		}
	}

	private setRaw(items: Collections[TName][]): void {
		try {
			localStorage.setItem(this.storageKey, JSON.stringify(items));
		} catch (error) {
			console.error(
				`Error setting localStorage data for key "${this.storageKey}":`,
				error,
			);
		}
	}

	getNotifyOne(data: Collections[TName]): DocumentApi<TName> {
		const id = data.id;

		const existing = this.records.get(id)?.deref();

		if (!existing) {
			const newDoc = new DocumentApiImpl<TName>(
				new BehaviorSubject(data),
				this,
				this.schema,
			);
			this.records.set(id, new WeakRef(newDoc));
			return newDoc;
		}

		if (existing.data.getValue().revision !== data.revision) {
			existing.data.next(data);
		}
		return existing;
	}

	async get(filter?: TFilter): Promise<DocumentApi<TName>[]> {
		const items = this.getRaw();
		return items
			.filter((item: Collections[TName]) => this.filterFn(item, filter))
			.map((item: Collections[TName]) => this.getNotifyOne(item));
	}

	async getOne(filter: TFilter): Promise<DocumentApi<TName> | null> {
		const items = await this.get(filter);
		return items.length > 0 ? items[0] : null;
	}

	async create(
		newItem: Omit<Collections[TName], 'id' | 'revision'>,
	): Promise<DocumentApi<TName>> {
		const items = this.getRaw();
		const data = {
			...newItem,
			id: this.generateId(),
			revision: 0,
		} as Collections[TName];
		items.push(data);
		this.setRaw(items);

		return this.getNotifyOne(data);
	}

	__set(item: Collections[TName]): void {
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

class DocumentApiImpl<TName extends keyof Collections>
	implements DocumentApi<TName>
{
	public readonly data: BehaviorSubject<Collections[TName]>;
	private readonly collection: CollectionPrivate<TName>;
	private readonly schema: ZodSchema<Collections[TName]>;

	constructor(
		data: BehaviorSubject<Collections[TName]>,
		collection: CollectionPrivate<TName>,
		schema: ZodSchema<Collections[TName]>,
	) {
		this.data = data;
		this.collection = collection;
		this.schema = schema;
	}

	async update(
		changeSet: ChangeSet<Omit<Collections[TName], 'id' | 'revision'>>,
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
