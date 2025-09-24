import { useEffect, useState } from 'react';
import type { Observable } from 'rxjs';

export default function useBehaviorSubject<T>(
	subject$: Observable<T> & { value: T },
): T;
export default function useBehaviorSubject<T>(
	subject$?: Observable<T> & { value: T },
): T | undefined;

export default function useBehaviorSubject<T>(
	subject$?: Observable<T> & { value: T },
): T | undefined {
	const [value, setValue] = useState(subject$?.value);

	useEffect(() => {
		if (subject$) {
			const subscription = subject$.subscribe(setValue);
			return () => subscription.unsubscribe();
		} else {
			setValue(undefined);
		}
	}, [subject$]);

	return value;
}
