import { Observable, type OperatorFunction } from 'rxjs';

export const Skip = Symbol('Skip');

export type Filtered<T> = T | typeof Skip;

export default function filterMap<T, U>(
	filterMap: (value: T) => Filtered<U>,
): OperatorFunction<T, U> {
	return function (source: Observable<T>) {
		return new Observable<U>((subscriber) => {
			return source.subscribe({
				error(err) {
					subscriber.error(err);
				},
				complete() {
					subscriber.complete();
				},
				next(value) {
					const result = filterMap(value);
					if (result === Skip) {
						return;
					}
					subscriber.next(result);
				},
			});
		});
	};
}
