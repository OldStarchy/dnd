import type { BehaviorSubject, Observable } from 'rxjs';

import type { AsyncOption } from '@/lib/AsyncOption';
import type { ChangeSet } from '@/lib/changeSet';

import type { QueryResults, ReadonlyQueryResults } from './QueryResults';
import type { AnyRecordType } from './RecordType';

export interface ReadonlyCollection<RecordType extends AnyRecordType> {
	readonly name: string;
	get(
		filter?: RecordType['filter'],
	): Promise<ReadonlyQueryResults<RecordType>>;
	get$(
		filter?: RecordType['filter'],
	): Observable<ReadonlySet<ReadonlyDocumentApi<RecordType>>>;
	getOne(
		filter?: RecordType['filter'],
	): AsyncOption<ReadonlyDocumentApi<RecordType>>;
}

export interface ReadonlyDocumentApi<RecordType extends AnyRecordType> {
	readonly data: Omit<BehaviorSubject<RecordType['record']>, 'next'>;
	readonly collection: ReadonlyCollection<RecordType>;
}

export interface Collection<RecordType extends AnyRecordType>
	extends ReadonlyCollection<RecordType> {
	readonly name: string;
	get(filter?: RecordType['filter']): Promise<QueryResults<RecordType>>;
	get$(
		filter?: RecordType['filter'],
	): Observable<ReadonlySet<DocumentApi<RecordType>>>;
	getOne(filter?: RecordType['filter']): AsyncOption<DocumentApi<RecordType>>;

	create(
		newItem: Omit<RecordType['record'], 'id' | 'revision'>,
	): Promise<DocumentApi<RecordType>>;
	update(
		id: RecordType['record']['id'],
		revision: number,
		changeSet: ChangeSet<Omit<RecordType['record'], 'id' | 'revision'>>,
	): Promise<void>;
	delete(id: RecordType['record']['id'], revision: number): Promise<void>;
}

export interface DocumentApi<RecordType extends AnyRecordType>
	extends ReadonlyDocumentApi<RecordType> {
	readonly data: Omit<BehaviorSubject<RecordType['record']>, 'next'>;
	readonly collection: Collection<RecordType>;

	update(
		changeSet: ChangeSet<Omit<RecordType['record'], 'id' | 'revision'>>,
	): Promise<void>;
	delete(): Promise<void>;
}
