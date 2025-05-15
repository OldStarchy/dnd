import {
	useCallback,
	useEffect,
	useState,
	type Dispatch,
	type SetStateAction,
} from 'react';

function useLocalStorage(
	key: string,
): [string | null, Dispatch<SetStateAction<string | null>>];
function useLocalStorage<T extends string | null>(
	key: string,
	readTransformer: (stored: string | null) => T,
): [T, Dispatch<SetStateAction<string | null>>];
function useLocalStorage<T>(
	key: string,
	readTransformer: (stored: string | null) => T,
	writeTransformer: (value: T) => string,
): [T, Dispatch<SetStateAction<T>>];

function useLocalStorage<T>(
	key: string,
	readTransformer?: (stored: string | null) => T,
	writeTransformer: (value: T | string | null) => string | null = (v) =>
		v as string | null,
): [T | string | null, Dispatch<SetStateAction<T | string | null>>] {
	const [value, setValue] = useState<T | string | null>(
		readTransformer
			? readTransformer(localStorage.getItem(key))
			: localStorage.getItem(key),
	);

	const setStoredValue = useCallback(
		(
			newValueOrCallback:
				| string
				| null
				| ((oldValue: T | string | null) => T | string | null),
		) => {
			const cb =
				typeof newValueOrCallback === 'function'
					? newValueOrCallback
					: () => newValueOrCallback as string | null;

			const oldValue = localStorage.getItem(key);

			const newValue = writeTransformer(
				cb(
					readTransformer
						? readTransformer(localStorage.getItem(key))
						: (localStorage.getItem(key) as T),
				) as T,
			);

			if (newValue === null) {
				localStorage.removeItem(key);
			} else {
				localStorage.setItem(key, newValue);
			}

			window.dispatchEvent(
				new StorageEvent('storage', {
					key,
					newValue,
					oldValue,
				}),
			);
			// setValue(newValue); // handled by storage event below
		},
		[key],
	);

	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			if (event.key === key) {
				setValue(event.newValue);
			}
		};
		window.addEventListener('storage', handleStorageChange);
		return () => {
			window.removeEventListener('storage', handleStorageChange);
		};
	}, [key]);

	return [
		value as T | string | null,
		setStoredValue as Dispatch<SetStateAction<T | string | null>>,
	];
}

export default useLocalStorage;
