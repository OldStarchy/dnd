import { type ChangeSet, applyChangeset } from '@/lib/changeSet';
import { BehaviorSubject, Subject } from 'rxjs';
import type { ZodType as ZodSchema } from 'zod';
import type { Collection, DocumentApi } from './Collection';
import type { AnyRecordType } from './RecordType';

export abstract class LocalCollection<in out RecordType extends AnyRecordType>
	implements Collection<RecordType>
{
	private _change$ = new Subject<DocumentApi<RecordType>>();
	readonly change$ = this._change$.asObservable();

	private readonly records: Map<string, WeakRef<DocumentApiImpl<RecordType>>>;

	constructor(
		readonly name: string,
		private readonly filterFn: (
			item: RecordType['record'],
			filter?: RecordType['filter'],
		) => boolean,
		protected readonly schema: ZodSchema<RecordType['record']>,
	) {
		this.records = new Map<string, WeakRef<DocumentApiImpl<RecordType>>>();
	}

	private generateId(): string {
		return crypto.randomUUID();
	}

	protected abstract getRaw(): RecordType['record'][];

	protected abstract setRaw(items: RecordType['record'][]): void;

	getNotifyOne(data: RecordType['record']): DocumentApi<RecordType> {
		const id = data.id;

		const existing = this.records.get(id)?.deref();

		if (!existing) {
			const newDoc = new DocumentApiImpl<RecordType>(
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

	async get(
		filter?: RecordType['filter'],
	): Promise<DocumentApi<RecordType>[]> {
		const items = this.getRaw();
		return items
			.filter((item: RecordType['record']) => this.filterFn(item, filter))
			.map((item: RecordType['record']) => this.getNotifyOne(item));
	}

	async getOne(
		filter?: RecordType['filter'],
	): Promise<DocumentApi<RecordType> | null> {
		const items = await this.get(filter);
		return items.length > 0 ? items[0] : null;
	}

	async create(
		newItem: Omit<RecordType['record'], 'id' | 'revision'>,
	): Promise<DocumentApi<RecordType>> {
		const data = {
			...newItem,
			id: this.generateId(),
			revision: 0,
		} as RecordType['record'];
		const parsed = await this.schema.safeParseAsync(data);

		if (!parsed.success) {
			throw new Error(`Invalid data: ${JSON.stringify(parsed.error)}`);
		}

		const items = this.getRaw();
		items.push(data);
		this.setRaw(items);

		return this.getNotifyOne(data);
	}

	private __set = (item: RecordType['record']): void => {
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
class DocumentApiImpl<in out RecordType extends AnyRecordType>
	implements DocumentApi<RecordType>
{
	public readonly data: BehaviorSubject<RecordType['record']>;
	readonly collection: LocalCollection<RecordType>;
	private readonly schema: ZodSchema<RecordType['record']>;

	private friendFunctions: {
		__set(item: RecordType['record']): void;
		__delete: (id: string) => void;
	};

	constructor(
		data: BehaviorSubject<RecordType['record']>,
		collection: LocalCollection<RecordType>,
		friendFunctions: {
			__set(item: RecordType['record']): void;
			__delete: (id: string) => void;
		},
		schema: ZodSchema<RecordType['record']>,
	) {
		this.data = data;
		this.collection = collection;
		this.friendFunctions = friendFunctions;
		this.schema = schema;
	}

	async update(
		changeSet: ChangeSet<Omit<RecordType['record'], 'id' | 'revision'>>,
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
