import {
	useEffect,
	useMemo,
	useRef,
	useState,
	type DependencyList,
} from 'react';

export default function usePromiseLike<T>(
	getter: PromiseLike<T>,
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
	const memoGetter = useMemo(() => getter, deps);

	const working = useRef(false);
	const [state, setState] = useState<{
		ready: boolean;
		value: T | undefined;
	}>({ ready: false, value: undefined });

	useEffect(() => {
		let cancelled = false;
		if (working.current) return;
		working.current = true;

		setState({ ready: false, value: undefined });
		memoGetter().then((value) => {
			if (!cancelled) {
				setState({ ready: true, value });
			}
		});
		return () => {
			cancelled = true;
			working.current = false;
		};
	}, [memoGetter]);

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
