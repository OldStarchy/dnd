import { BehaviorSubject, Observable } from 'rxjs';
import { type ChangeSet } from '../lib/changeSet';

export interface Collection<
	T extends { id: string; revision: number },
	TFilter = void,
> {
	readonly name: string;
	get(filter?: TFilter): Promise<DocumentApi<T>[]>;
	getOne(filter: TFilter): Promise<DocumentApi<T> | null>;
	create(newItem: T): Promise<DocumentApi<T>>;

	readonly change$: Observable<DocumentApi<T>>;
}

export interface CollectionPrivate<T extends { id: string; revision: number }> {
	__set(item: T): void;
	__delete(id: string): void;
}

export interface DocumentApi<T extends { id: string; revision: number }> {
	readonly data: Omit<BehaviorSubject<T>, 'next'>;

	update(changeSet: ChangeSet<Omit<T, 'id' | 'revision'>>): Promise<void>;
	delete(): Promise<void>;
}
