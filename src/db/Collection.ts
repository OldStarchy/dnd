/* eslint-disable @typescript-eslint/no-explicit-any */
import { BehaviorSubject, Observable } from 'rxjs';
import { type ChangeSet } from '../lib/changeSet';

export interface ReadonlyCollection<
	in out T extends { id: string; revision: number },
	in TFilter = void,
> {
	readonly name: string;
	get(
		filter?: TFilter,
	): Promise<ReadonlyDocumentApi<T, ReadonlyCollection<T, TFilter>>[]>;
	getOne(
		filter: TFilter,
	): Promise<ReadonlyDocumentApi<T, ReadonlyCollection<T, TFilter>> | null>;

	readonly change$: Observable<
		ReadonlyDocumentApi<T, ReadonlyCollection<T, TFilter>>
	>;
}

export interface Collection<
	in out T extends { id: string; revision: number },
	in TFilter = void,
> extends ReadonlyCollection<T, TFilter> {
	readonly name: string;
	get(filter?: TFilter): Promise<DocumentApi<T, Collection<T, TFilter>>[]>;
	getOne(
		filter: TFilter,
	): Promise<DocumentApi<T, Collection<T, TFilter>> | null>;
	create(newItem: T): Promise<DocumentApi<T, Collection<T, TFilter>>>;

	readonly change$: Observable<DocumentApi<T, Collection<T, TFilter>>>;
}

export interface CollectionPrivate<T extends { id: string; revision: number }> {
	__set(item: T): void;
	__delete(id: string): void;
}

export interface ReadonlyDocumentApi<
	in out T extends { id: string; revision: number },
	TCollection extends ReadonlyCollection<T, any>,
> {
	readonly data: Omit<BehaviorSubject<T>, 'next'>;
	readonly collection: TCollection;
}

export interface DocumentApi<
	in out T extends { id: string; revision: number },
	TCollection extends Collection<T, any>,
> extends ReadonlyDocumentApi<T, TCollection> {
	readonly data: Omit<BehaviorSubject<T>, 'next'>;
	readonly collection: TCollection;

	update(changeSet: ChangeSet<Omit<T, 'id' | 'revision'>>): Promise<void>;
	delete(): Promise<void>;
}
