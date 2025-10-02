import type { Observable, Observer, Subscribable, Unsubscribable } from 'rxjs';

export default interface ObservableWithValue<T> extends Subscribable<T> {
	readonly value: T;

	subscribe(
		observerOrNext?: Partial<Observer<T>> | ((value: T) => void),
	): Unsubscribable;

	asObservable(): Observable<T>;
}
