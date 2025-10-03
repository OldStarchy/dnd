import { Observable, share, startWith, tap } from 'rxjs';
import type { Observer, Subscribable, Unsubscribable } from 'rxjs';

import type ObservableWithValue from './ObservableWithValue';

export default class LazyBehaviorSubject<T>
	implements Subscribable<T>, ObservableWithValue<T>
{
	#source: Observable<T>;

	#value: T;
	get value(): T {
		return this.#value;
	}

	constructor(
		initialValue: T,
		...args: ConstructorParameters<typeof Observable<T>>
	) {
		this.#source = new Observable<T>(...args).pipe(
			share(),
			tap({
				next: (v) => {
					this.#value = v;
				},
			}),
		);
		this.#value = initialValue;
	}

	subscribe(
		observerOrNext?: Partial<Observer<T>> | ((value: T) => void),
	): Unsubscribable {
		return this.asObservable().subscribe(observerOrNext);
	}

	asObservable(): Observable<T> {
		return this.#source.pipe(startWith(this.#value));
	}
}
