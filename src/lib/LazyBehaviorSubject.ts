import { Observable, share, startWith, tap } from 'rxjs';
import type { Observer, Subscribable, Unsubscribable } from 'rxjs';

export default class LazyBehaviorSubject<T> implements Subscribable<T> {
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

	subscribe(observer: Partial<Observer<T>>): Unsubscribable {
		return this.#source.pipe(startWith(this.#value)).subscribe(observer);
	}
}
