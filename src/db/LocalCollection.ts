import { type ChangeSet, applyChangeset } from '@/lib/changeSet';
import { BehaviorSubject, Subject } from 'rxjs';
import type { ZodType as ZodSchema } from 'zod';
import type { Collection, DocumentApi } from './Collection';

export abstract class LocalCollection<
	const TName extends string,
	T extends { id: string; revision: number },
	TFilter,
> implements Collection<TName, T, TFilter>
{
	readonly name: TName;
	private readonly filterFn: (item: T, filter?: TFilter) => boolean;
	protected readonly schema: ZodSchema<T>;

	private _change$ = new Subject<DocumentApi<TName, T, TFilter>>();
	readonly change$ = this._change$.asObservable();

	private readonly records: Map<
		string,
		WeakRef<DocumentApiImpl<TName, T, TFilter>>
	>;

	constructor(
		name: TName,
		filterFn: (item: T, filter?: TFilter) => boolean,
		schema: ZodSchema<T>,
	) {
		this.name = name;
		this.filterFn = filterFn;
		this.schema = schema;

		this.records = new Map<
			string,
			WeakRef<DocumentApiImpl<TName, T, TFilter>>
		>();
	}

	private generateId(): string {
		return crypto.randomUUID();
	}

	protected abstract getRaw(): T[];

	protected abstract setRaw(items: T[]): void;

	getNotifyOne(data: T): DocumentApi<TName, T, TFilter> {
		const id = data.id;

		const existing = this.records.get(id)?.deref();

		if (!existing) {
			const newDoc = new DocumentApiImpl<TName, T, TFilter>(
				new BehaviorSubject(data),
				this,
				{ __set: this.__set, __delete: this.__delete },
				this.schema,
			);
			this.records.set(id, new WeakRef(newDoc));
			this._change$.next(newDoc);
			return newDoc;
		}

		if (existing.data.getValue().revision !== data.revision) {
			existing.data.next(data);
			this._change$.next(existing);
		}
		return existing;
	}

	async get(filter?: TFilter): Promise<DocumentApi<TName, T, TFilter>[]> {
		const items = this.getRaw();
		return items
			.filter((item: T) => this.filterFn(item, filter))
			.map((item: T) => this.getNotifyOne(item));
	}

	async getOne(
		filter?: TFilter,
	): Promise<DocumentApi<TName, T, TFilter> | null> {
		const items = await this.get(filter);
		return items.length > 0 ? items[0] : null;
	}

	async create(
		newItem: Omit<T, 'id' | 'revision'>,
	): Promise<DocumentApi<TName, T, TFilter>> {
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

	private __set = (item: T): void => {
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
			this._change$.next(existing);
		}
	};

	private __delete = (id: string): void => {
		const records = this.getRaw();
		if (!records.some((item) => item.id === id)) {
			return;
		}
		const newRecords = records.filter((item) => item.id !== id);
		this.setRaw(newRecords);

		const existing = this.records.get(id)?.deref();
		if (existing) {
			existing.data.complete();
			this._change$.next(existing);
		}
		this.records.delete(id);
	};
}
class DocumentApiImpl<
	TName extends string,
	T extends { id: string; revision: number },
	TFilter,
> implements DocumentApi<TName, T, TFilter>
{
	public readonly data: BehaviorSubject<T>;
	readonly collection: LocalCollection<TName, T, TFilter>;
	private readonly schema: ZodSchema<T>;

	private friendFunctions: {
		__set(item: T): void;
		__delete: (id: string) => void;
	};

	constructor(
		data: BehaviorSubject<T>,
		collection: LocalCollection<TName, T, TFilter>,
		friendFunctions: {
			__set(item: T): void;
			__delete: (id: string) => void;
		},
		schema: ZodSchema<T>,
	) {
		this.data = data;
		this.collection = collection;
		this.friendFunctions = friendFunctions;
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
		this.friendFunctions.__set(parsed);
	}

	async delete(): Promise<void> {
		this.friendFunctions.__delete(this.data.getValue().id);
	}
}
