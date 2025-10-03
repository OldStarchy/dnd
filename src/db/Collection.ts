import type { Observable } from 'rxjs';

import type { AsyncOption } from '@/lib/AsyncOption';
import type { ChangeSet } from '@/lib/changeSet';
import type ObservableWithValue from '@/lib/ObservableWithValue';
import type { DndDb } from '@/sync/room/RoomApi';

import type { AnyRecordType } from './RecordType';

export interface Collection<
	RecordType extends AnyRecordType,
	DocumentSpecies = DocumentApi<RecordType>,
> {
	readonly name: string;
	readonly db: DndDb;

	/**
	 * Returns a set of documents matching the filter.
	 */
	get(filter?: RecordType['filter']): Promise<DocumentSpecies[]>;

	/**
	 * Returns a single document matching the filter, if any.
	 */
	getOne(filter?: RecordType['filter']): AsyncOption<DocumentSpecies>;

	/**
	 * Returns a stream of sets of documents matching the filter.
	 *
	 * As long as the `get$` subscription is active, each records `.data$` will
	 * be live.
	 */
	get$(filter?: RecordType['filter']): Observable<DocumentSpecies[]>;

	/**
	 * Creates a new document with the given data.
	 */
	create(
		newItem: Omit<RecordType['record'], 'id' | 'revision'>,
	): Promise<DocumentSpecies>;

	/**
	 * Updates the document with the given id and revision using the provided
	 * changeset.
	 *
	 * The update will only succeed if the current revision of the document
	 * matches the provided revision. If the update is successful, the document's
	 * revision will be incremented by 1.
	 *
	 * If the document with the given id does not exist, or if the revision
	 * does not match, an error will be thrown.
	 *
	 * Note that the update will not be reflected unless this document is made
	 * "live" ie. by being part of a `get$` subscription or subscribing to
	 * `.data$`.
	 */
	update(
		id: RecordType['record']['id'],
		revision: number,
		changeSet: ChangeSet<Omit<RecordType['record'], 'id' | 'revision'>>,
	): Promise<void>;

	/**
	 * Deletes the document with the given id and revision.
	 *
	 * The deletion will only succeed if the current revision of the document
	 * matches the provided revision.
	 */
	delete(id: RecordType['record']['id'], revision: number): Promise<void>;
}

export class DocumentApi<RecordType extends AnyRecordType> {
	get data() {
		return this.data$.value;
	}

	constructor(
		/**
		 * Contains the most recent known data for this document. This is only
		 * kept up to date if is "live".
		 *
		 * A document becomes "live" when it is part of a `get$` subscription
		 * or when its `.data$` is subscribed to.
		 */
		readonly data$: ObservableWithValue<RecordType['record']>,
		readonly collection: Collection<RecordType, DocumentApi<RecordType>>,
	) {}

	async update(
		changeSet: ChangeSet<Omit<RecordType['record'], 'id' | 'revision'>>,
	): Promise<void> {
		const { id, revision } = this.data;

		return this.collection.update(id, revision, changeSet);
	}

	async delete(): Promise<void> {
		const { id, revision } = this.data;

		return this.collection.delete(id, revision);
	}
}
