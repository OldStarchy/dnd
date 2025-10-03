import {
	type DependencyList,
	useCallback,
	useEffect,
	useRef,
	useState,
} from 'react';

type PendingResult<T> =
	| {
			ready: false;
			value?: never;
			error?: unknown;
	  }
	| {
			ready: true;
			value: T;
			error?: never;
	  };

export default function usePromiseLike<T>(
	promiseFactory: (signal: AbortSignal) => PromiseLike<T>,
	deps?: DependencyList,
): PendingResult<T> {
	const promiseRef = useRef<PromiseLike<T> | null>(null);

	const [state, setState] = useState<PendingResult<T>>({
		ready: false,
		value: undefined,
	});

	const setResult = useCallback((value: T) => {
		setState({ ready: true, value });
	}, []);

	const setError = useCallback((error: unknown) => {
		setState({ ready: false, error });
	}, []);

	const clearResult = useCallback(() => {
		setState({ ready: false });
	}, []);

	useEffect(() => {
		const controller = new AbortController();
		const signal = controller.signal;

		promiseRef.current = promiseFactory(signal);

		promiseRef.current.then(
			(v) => {
				if (!signal.aborted) {
					setResult(v);
				}
			},
			(e) => {
				if (!signal.aborted) {
					setError(e);
				}
			},
		);

		return () => {
			controller.abort();
			clearResult();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, deps);

	return state;
}
