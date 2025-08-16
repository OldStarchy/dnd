import { BehaviorSubject, Observable } from 'rxjs';
import { type ChangeSet } from '../lib/changeSet';
import type { AnyRecordType } from './RecordType';

export interface ReadonlyCollection<in out RecordType extends AnyRecordType> {
	readonly name: string;
	get(
		filter?: RecordType['filter'],
	): Promise<ReadonlyDocumentApi<RecordType>[]>;
	getOne(
		filter: RecordType['filter'],
	): Promise<ReadonlyDocumentApi<RecordType> | null>;

	readonly change$: Observable<ReadonlyDocumentApi<RecordType>>;
}

export interface ReadonlyDocumentApi<in out RecordType extends AnyRecordType> {
	readonly data: Omit<BehaviorSubject<RecordType['record']>, 'next'>;
	readonly collection: ReadonlyCollection<RecordType>;
}

export interface Collection<in out RecordType extends AnyRecordType>
	extends ReadonlyCollection<RecordType> {
	readonly name: string;
	get(filter?: RecordType['filter']): Promise<DocumentApi<RecordType>[]>;
	getOne(
		filter: RecordType['filter'],
	): Promise<DocumentApi<RecordType> | null>;
	create(
		newItem: Omit<RecordType['record'], 'id' | 'revision'>,
	): Promise<DocumentApi<RecordType>>;

	readonly change$: Observable<DocumentApi<RecordType>>;
}

export interface DocumentApi<in out RecordType extends AnyRecordType>
	extends ReadonlyDocumentApi<RecordType> {
	readonly data: Omit<BehaviorSubject<RecordType['record']>, 'next'>;
	readonly collection: Collection<RecordType>;

	update(
		changeSet: ChangeSet<Omit<RecordType['record'], 'id' | 'revision'>>,
	): Promise<void>;
	delete(): Promise<void>;
}
