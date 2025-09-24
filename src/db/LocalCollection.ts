import { AsyncOption } from '@/lib/AsyncOption';
import { type ChangeSet, applyChangeset } from '@/lib/changeSet';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import type { ZodType as ZodSchema } from 'zod';
import type { Collection, DocumentApi } from './Collection';
import { QueryResults } from './QueryResults';
import type { AnyRecordType } from './RecordType';

export abstract class LocalCollection<RecordType extends AnyRecordType>
	implements Collection<RecordType>
{
	#change$ = new Subject<
		| { type: 'create' | 'update'; document: DocumentApi<RecordType> }
		| { type: 'delete'; id: RecordType['record']['id'] }
	>();

	private readonly documentCache: Map<
		string,
		WeakRef<InstanceType<typeof LocalCollection.DocumentApi<RecordType>>>
	>;

	constructor(
		readonly name: string,
		private readonly filterFn: (
			item: RecordType['record'],
			filter?: RecordType['filter'],
		) => boolean,
		protected readonly schema: ZodSchema<RecordType['record']>,
	) {
		this.documentCache = new Map<
			string,
			WeakRef<
				InstanceType<typeof LocalCollection.DocumentApi<RecordType>>
			>
		>();
	}

	private generateId(): string {
		return crypto.randomUUID();
	}

	protected abstract getRaw(): RecordType['record'][];

	protected abstract setRaw(items: RecordType['record'][]): void;

	private wrap(data: RecordType['record']): DocumentApi<RecordType> {
		const id = data.id;

		const existing = this.documentCache.get(id)?.deref();

		if (!existing) {
			const newDoc = new LocalCollection.DocumentApi<RecordType>(
				new BehaviorSubject(data),
				this,
			);
			this.documentCache.set(id, new WeakRef(newDoc));
			return newDoc;
		} else {
			existing.data.next(data);
		}

		return existing;
	}

	async get(
		filter?: RecordType['filter'],
	): Promise<QueryResults<RecordType>> {
		const items = this.getRaw();
		return new QueryResults(
			...items
				.filter((item: RecordType['record']) =>
					this.filterFn(item, filter),
				)
				.map((item: RecordType['record']) => this.wrap(item)),
		);
	}

	get$(
		filter?: RecordType['filter'],
	): Observable<ReadonlySet<DocumentApi<RecordType>>> {
		return new Observable((subscriber) => {
			(async () => {
				let results = new Set(await this.get(filter));
				subscriber.next(results);

				subscriber.add(
					this.#change$.subscribe((change) => {
						switch (change.type) {
							case 'create':
								if (
									this.filterFn(
										change.document.data.value,
										filter,
									)
								) {
									results = new Set([
										...results,
										change.document,
									]);
									subscriber.next(results);
								}
								break;

							case 'update':
								{
									const exists = results.has(change.document);
									const matches = this.filterFn(
										change.document.data.value,
										filter,
									);

									if (exists && !matches) {
										results = new Set(
											[...results].filter(
												(doc) =>
													doc !== change.document,
											),
										);
										subscriber.next(results);
									} else if (!exists && matches) {
										results = new Set([
											...results,
											change.document,
										]);
										subscriber.next(results);
									}
								}
								break;

							case 'delete':
								{
									const existing = results
										.values()
										.find(
											(doc) =>
												doc.data.value.id === change.id,
										);
									if (existing) {
										results = new Set(
											[...results].filter(
												(doc) => doc !== existing,
											),
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

	getOne(
		filter?: RecordType['filter'],
	): AsyncOption<DocumentApi<RecordType>> {
		return AsyncOption.of(this.get(filter).then((items) => items[0]));
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

		this.documentCache.get(id)?.deref()?.data.complete();
		this.documentCache.delete(id);

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

	private static DocumentApi = class DocumentApi<
		RecordType extends AnyRecordType,
	> implements DocumentApi<RecordType>
	{
		constructor(
			readonly data: BehaviorSubject<RecordType['record']>,
			readonly collection: LocalCollection<RecordType>,
		) {}

		async update(
			changeSet: ChangeSet<Omit<RecordType['record'], 'id' | 'revision'>>,
		): Promise<void> {
			const { id, revision } = this.data.value;

			return this.collection.update(id, revision, changeSet);
		}

		async delete(): Promise<void> {
			return this.collection.delete(this.data.getValue().id);
		}
	};
}
