import { BehaviorSubject, Observable } from 'rxjs';
import { type ChangeSet } from '../lib/changeSet';

export interface Collection<
	TName extends string,
	T extends { id: string; revision: number },
	TFilter = void,
> {
	readonly name: TName;
	get(filter?: TFilter): Promise<DocumentApi<TName, T, TFilter>[]>;
	getOne(filter: TFilter): Promise<DocumentApi<TName, T, TFilter> | null>;
	create(newItem: T): Promise<DocumentApi<TName, T, TFilter>>;

	readonly change$: Observable<DocumentApi<TName, T, TFilter>>;
}

export interface CollectionPrivate<T extends { id: string; revision: number }> {
	__set(item: T): void;
	__delete(id: string): void;
}

export interface DocumentApi<
	TName extends string,
	T extends { id: string; revision: number },
	TFilter,
> {
	readonly data: Omit<BehaviorSubject<T>, 'next'>;
	readonly collection: Collection<TName, T, TFilter>;

	update(changeSet: ChangeSet<Omit<T, 'id' | 'revision'>>): Promise<void>;
	delete(): Promise<void>;
}
