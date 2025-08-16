import { useEffect, useState } from 'react';
import type { Observable } from 'rxjs';

export default function useBehaviorSubject<T>(
	subject$: Observable<T> & { value: T },
): T {
	const [value, setValue] = useState(subject$.value);

	useEffect(() => {
		const subscription = subject$.subscribe(setValue);
		return () => subscription.unsubscribe();
	}, [subject$]);

	return value;
}
