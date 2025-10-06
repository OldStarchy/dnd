import { BehaviorSubject, Observable, Subject } from 'rxjs';
import type z from 'zod';

import { AsyncOption } from '@/lib/AsyncOption';
import { applyChangeset, type ChangeSet } from '@/lib/changeSet';
import createUuid from '@/lib/uuid';
import type { DndDb } from '@/sync/room/RoomApi';

import type { Collection, DocumentApi } from './Collection';
import type { AnyRecordType, RecordTypeDefinition } from './RecordType';

export abstract class LocalCollection<
	RecordType extends AnyRecordType,
	Document extends DocumentApi<RecordType>,
> implements Collection<RecordType, Document>
{
	#change$ = new Subject<
		| { type: 'create' | 'update'; document: Document }
		| { type: 'delete'; id: RecordType['record']['id'] }
	>();

	private readonly documentCache: Map<string, WeakRef<Document>>;
	private readonly data$Cache: WeakMap<
		Document,
		BehaviorSubject<RecordType['record']>
	> = new WeakMap();

	readonly name: string;
	private readonly filterFn: (
		item: RecordType['record'],
		filter: RecordType['filter'],
	) => boolean;
	protected readonly schema: z.ZodSchema<RecordType['record']>;
	readonly Document: {
		new (
			data$: BehaviorSubject<RecordType['record']>,
			collection: Collection<RecordType, Document>,
		): Document;
	};

	constructor(
		definition: RecordTypeDefinition<
			RecordType['record'],
			RecordType['filter'],
			Document
		>,
		readonly db: DndDb,
	) {
		this.name = definition.name;
		this.filterFn = definition.filterFn;
		this.schema = definition.schema;
		this.Document = definition.documentClass;
		this.documentCache = new Map<string, WeakRef<Document>>();
	}

	private generateId(): string {
		return createUuid();
	}

	protected abstract getRaw(): RecordType['record'][];

	protected abstract setRaw(items: RecordType['record'][]): void;

	private wrap(data: RecordType['record']): Document {
		const id = data.id;

		const existing = this.documentCache.get(id)?.deref();

		if (!existing) {
			const data$ = new BehaviorSubject(data);
			const newDoc = new this.Document(data$, this);

			this.documentCache.set(id, new WeakRef(newDoc));
			this.data$Cache.set(newDoc, data$);

			return newDoc;
		} else {
			this.data$Cache.get(existing)?.next(data);
		}

		return existing;
	}

	async get(filter?: RecordType['filter']): Promise<Document[]> {
		let items = this.getRaw();

		if (filter)
			items = items.filter((item: RecordType['record']) =>
				this.filterFn(item, filter),
			);

		return items.map((item: RecordType['record']) => this.wrap(item));
	}

	get$(filter?: RecordType['filter']): Observable<Document[]> {
		return new Observable((subscriber) => {
			(async () => {
				let results = await this.get(filter);
				subscriber.next(results);

				subscriber.add(
					this.#change$.subscribe((change) => {
						switch (change.type) {
							case 'create':
								if (
									!filter ||
									this.filterFn(change.document.data, filter)
								) {
									results = [...results, change.document];
									subscriber.next(results);
								}
								break;

							case 'update':
								{
									const exists = results.some(
										({ data: { id } }) =>
											id === change.document.data.id,
									);

									const matches =
										!filter ||
										this.filterFn(
											change.document.data,
											filter,
										);

									if (exists && !matches) {
										results = results.filter(
											(doc) => doc !== change.document,
										);
										subscriber.next(results);
									} else if (!exists && matches) {
										results = [...results, change.document];
										subscriber.next(results);
									} else if (exists) {
										subscriber.next(results);
									}
								}
								break;

							case 'delete':
								{
									const existing = results
										.values()
										.find(
											(doc) => doc.data.id === change.id,
										);
									if (existing) {
										results = results.filter(
											(doc) => doc !== existing,
										);
										subscriber.next(results);
									}
								}
								break;
						}
					}),
				);
			})();
		});
	}

	getOne(filter?: RecordType['filter']): AsyncOption<Document> {
		return AsyncOption.of(
			this.get(filter).then((items) => items.values().next().value),
		);
	}

	async create(
		newItem: Omit<RecordType['record'], 'id' | 'revision'>,
	): Promise<Document> {
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

		const document = this.wrap(data);
		this.#change$.next({ type: 'create', document });
		return document;
	}

	async delete(id: RecordType['record']['id']): Promise<void> {
		const records = this.getRaw();
		if (!records.some((item) => item.id === id)) {
			return;
		}
		const newRecords = records.filter((item) => item.id !== id);
		this.setRaw(newRecords);

		const existing = this.documentCache.get(id)?.deref();
		if (existing) {
			this.data$Cache.get(existing)?.complete();
			this.documentCache.delete(id);
		}

		this.#change$.next({ type: 'delete', id });
	}

	async update(
		id: RecordType['record']['id'],
		revision: number,
		changeSet: ChangeSet<Omit<RecordType['record'], 'id' | 'revision'>>,
	): Promise<void> {
		const records = this.getRaw();

		const existingIndex = records.findIndex((i) => i.id === id);
		if (existingIndex === -1) {
			throw new Error(`No record with id ${id} found`);
		}
		const oldData = records[existingIndex];

		if (oldData.revision !== revision) {
			throw new Error(
				`Cannot update item with id ${id} expected revision ${revision} but current revision is ${oldData.revision}`,
			);
		}

		const updated = applyChangeset(oldData, changeSet);

		if (updated === oldData) {
			return;
		}

		const parsed = this.schema.parse({
			...updated,
			id: oldData.id,
			revision: oldData.revision + 1,
		});

		records[existingIndex] = parsed;

		this.setRaw(records);

		const document = this.wrap(parsed);
		this.#change$.next({ type: 'update', document: document });
	}
}
