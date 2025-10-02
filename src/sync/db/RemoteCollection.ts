import { distinctUntilChanged, map, Observable } from 'rxjs';

import type { Collection, DocumentApi } from '@/db/Collection';
import type { AnyRecordType, RecordTypeDefinition } from '@/db/RecordType';
import { AsyncOption } from '@/lib/AsyncOption';
import type { ChangeSet } from '@/lib/changeSet';
import filterMap, { Skip } from '@/lib/filterMap';
import LazyBehaviorSubject from '@/lib/LazyBehaviorSubject';
import type ObservableWithValue from '@/lib/ObservableWithValue';
import { Option } from '@/lib/Option';
import type {
	CreateResult,
	DbNotificationMessages,
	DbRequestMessages,
	DbResponseMessages,
	Get$Result,
	GetOneResult,
	GetResult,
	SuccessResult,
} from '@/sync/db/Messages';
import type RoomHostConnection from '@/sync/room/RoomHostConnection';

import type { DndDb } from '../room/RoomApi';

export type RemoteCollectionMessages<T> =
	| DbRequestMessages<T>
	| DbResponseMessages<T>
	| DbNotificationMessages<T>;

export default class RemoteCollection<
	RecordType extends AnyRecordType = never,
	Document extends DocumentApi<RecordType> = DocumentApi<RecordType>,
> implements Collection<RecordType, Document>
{
	private readonly records = new Map<string, WeakRef<Document>>();

	readonly name: string;
	readonly Document: {
		new (
			data$: ObservableWithValue<RecordType['record']>,
			collection: Collection<RecordType['filter'], Document>,
		): Document;
	};
	constructor(
		definition: RecordTypeDefinition<
			RecordType['record'],
			RecordType['filter'],
			Document
		>,
		readonly db: DndDb,
		private readonly connection: RoomHostConnection,
	) {
		this.name = definition.name;
		this.Document = definition.documentClass;
	}

	private getCached(id: string): Option<Document> {
		return Option.of(this.records.get(id)?.deref());
	}
	private cache(id: string, document: Document): void {
		this.records.set(id, new WeakRef(document));
	}

	private wrap(data: RecordType['record']): Document {
		const { id } = data;

		return this.getCached(id).unwrapOrElse(() => {
			const newDoc = new this.Document(
				new LazyBehaviorSubject(data, (subscriber) => {
					this.createSubscription({ id: data.id })
						.pipe(
							map((records) => records.at(0)),
							distinctUntilChanged(
								(a: number | undefined, b) => a === b,
								(r) => r?.revision,
							),
						)
						.subscribe({
							complete: () => subscriber.complete(),
							error: (err) => subscriber.error(err),
							next: (record) => {
								if (record === undefined) {
									subscriber.complete();
									return;
								}
								subscriber.next(record);
							},
						});
				}),
				this,
			);

			this.cache(id, newDoc);
			return newDoc;
		});
	}

	async get(filter?: RecordType['filter']): Promise<Document[]> {
		const response = (await this.connection.gm.request({
			type: 'db',
			action: 'get',
			collection: this.name,
			filter: filter,
		})) as GetResult<RecordType>;

		return response.data.map((item) => this.wrap(item));
	}

	private createSubscription(filter?: RecordType['filter']) {
		return new Observable<RecordType['record'][]>((subscriber) => {
			const gmId = this.connection.gm.id;
			(async () => {
				const { subscriptionId } = (await this.connection.gm.request({
					type: 'db',
					action: 'get$',
					collection: this.name,
					filter: filter,
				})) as Get$Result;

				subscriber.add(() => {
					this.connection.gm.request({
						type: 'db',
						action: 'closeGet$',
						subscriptionId: subscriptionId,
					});
				});

				this.connection.notification$
					.pipe(
						filterMap((notification) =>
							notification.data.type === 'db' &&
							notification.data.subscriptionId ===
								subscriptionId &&
							notification.senderId === gmId
								? (notification.data
										.items as RecordType['record'][])
								: Skip,
						),
					)
					.subscribe(subscriber);
			})();
		});
	}

	get$(filter?: RecordType['filter']): Observable<Document[]> {
		return this.createSubscription(filter).pipe(
			map((items) => items.map((item) => this.wrap(item))),
		);
	}

	/**
	 * This doesn't produce "live" records, use `get$` if you need
	 * `.data$` to be live.
	 */
	getOne(filter?: RecordType['filter']): AsyncOption<Document> {
		return AsyncOption.of(
			(async () => {
				const response = (await this.connection.gm.request({
					type: 'db',
					action: 'getOne',
					collection: this.name,
					filter: filter,
				})) as GetOneResult<RecordType>;

				if (response.data === null) {
					return null;
				}

				return this.wrap(response.data as RecordType['record']);
			})(),
		);
	}

	async create(
		data: Omit<RecordType['record'], 'id' | 'revision'>,
	): Promise<Document> {
		const response = (await this.connection.gm.request({
			type: 'db',
			action: 'create',
			collection: this.name,
			data,
		})) as CreateResult<RecordType>;

		return this.wrap(response.data);
	}

	async update(
		id: RecordType['record']['id'],
		revision: number,
		changeSet: ChangeSet<Omit<RecordType['record'], 'id' | 'revision'>>,
	): Promise<void> {
		(await this.connection.gm.request({
			type: 'db',
			action: 'update',
			collection: this.name,
			id,
			revision,
			changeSet,
		})) as SuccessResult;
	}

	async delete(
		id: RecordType['record']['id'],
		revision: number,
	): Promise<void> {
		await this.connection.gm.request({
			type: 'db',
			action: 'delete',
			collection: this.name,
			id,
			revision,
		});
	}
}
