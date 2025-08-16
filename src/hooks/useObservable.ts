import { useEffect, useState } from 'react';
import type { Observable } from 'rxjs';

export default function useObservable<T>(
	subject$: Observable<T>,
): T | undefined;
export default function useObservable<T>(
	subject$: Observable<T>,
	initial: T,
): T;

export default function useObservable<T>(
	subject$: Observable<T>,
	initial?: T,
): T | undefined {
	const [value, setValue] = useState(initial);

	useEffect(() => {
		const subscription = subject$.subscribe((v) => {
			setValue(v);
		});
		return () => subscription.unsubscribe();
	}, [subject$]);

	return value;
}
