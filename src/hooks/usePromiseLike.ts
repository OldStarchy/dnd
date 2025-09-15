import { useEffect, useState, type DependencyList } from 'react';

export default function usePromiseLike<T>(
	getter: () => PromiseLike<T>,
	deps?: DependencyList,
):
	| {
			ready: true;
			value: T;
	  }
	| {
			ready: false;
			value: undefined;
	  } {
	const [state, setState] = useState<{
		ready: boolean;
		value: T | undefined;
	}>({
		ready: false,
		value: undefined,
	});

	useEffect(() => {
		let cancelled = false;
		setState({ ready: false, value: undefined });
		getter().then((value) => {
			if (!cancelled) {
				setState({ ready: true, value });
			}
		});
		return () => {
			cancelled = true;
		};
	}, [getter, deps]);

	return state as
		| {
				ready: true;
				value: T;
		  }
		| {
				ready: false;
				value: undefined;
		  };
}
