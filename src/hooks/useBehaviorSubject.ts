import { useEffect, useState } from 'react';

import type ObservableWithValue from '@/lib/ObservableWithValue';

export default function useBehaviorSubject<T>(
	subject$: ObservableWithValue<T>,
): T;
export default function useBehaviorSubject<T>(
	subject$?: ObservableWithValue<T>,
): T | undefined;

export default function useBehaviorSubject<T>(
	subject$?: ObservableWithValue<T>,
): T | undefined {
	const [value, setValue] = useState(subject$?.value);

	useEffect(() => {
		if (subject$) {
			const subscription = subject$.subscribe((v) => setValue(v));
			return () => subscription.unsubscribe();
		} else {
			setValue(undefined);
		}
	}, [subject$]);

	return value;
}
