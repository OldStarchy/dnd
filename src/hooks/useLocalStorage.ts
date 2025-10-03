import {
	type Dispatch,
	type SetStateAction,
	useCallback,
	useEffect,
	useState,
} from 'react';

import { LOCAL_STORAGE_NAMESPACE } from '@/const';

declare global {
	// eslint-disable-next-line @typescript-eslint/no-empty-object-type
	interface LocalStorageKeys {}
}

/**
 * Stores a string value in local storage.
 *
 * The key will automatically be prefixed with {@link LOCAL_STORAGE_NAMESPACE}.
 */
function useLocalStorage<TKey extends keyof LocalStorageKeys>(
	key: TKey,
): [string | null, Dispatch<SetStateAction<string | null>>];

/**
 * Converts values to string before storing them in local storage and parses
 * them with the provided readTransformer when reading them back.
 *
 * The key will automatically be prefixed with {@link LOCAL_STORAGE_NAMESPACE}.
 */
function useLocalStorage<
	TKey extends keyof LocalStorageKeys,
	TValue extends string | null,
>(
	key: TKey,
	readTransformer: (stored: string | null) => TValue,
): [TValue, Dispatch<SetStateAction<string | null>>];

/**
 * Allows storing arbitrary types in local storage by using the provided
 * read and write transformers to convert the values to and from strings.
 *
 * The key will automatically be prefixed with {@link LOCAL_STORAGE_NAMESPACE}.
 */
function useLocalStorage<TKey extends keyof LocalStorageKeys, TValue>(
	key: TKey,
	readTransformer: (stored: string | null) => TValue,
	writeTransformer: (value: TValue) => string,
): [TValue, Dispatch<SetStateAction<TValue>>];

function useLocalStorage<T>(
	key: string,
	readTransformer?: (stored: string | null) => T,
	writeTransformer: (value: T | string | null) => string | null = (v) =>
		v as string | null,
): [T | string | null, Dispatch<SetStateAction<T | string | null>>] {
	key = LOCAL_STORAGE_NAMESPACE + ':' + key;

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
		[key, readTransformer, writeTransformer],
	);

	useEffect(() => {
		const handleStorageChange = (event: StorageEvent) => {
			if (event.key === key) {
				setValue(
					readTransformer
						? readTransformer(event.newValue)
						: (event.newValue as T | string | null),
				);
			}
		};
		window.addEventListener('storage', handleStorageChange);
		return () => {
			window.removeEventListener('storage', handleStorageChange);
		};
	}, [key, readTransformer, writeTransformer]);

	return [
		value as T | string | null,
		setStoredValue as Dispatch<SetStateAction<T | string | null>>,
	];
}

export default useLocalStorage;

export function getLocalStorage<T>(
	key: string,
	readTransformer?: (stored: string | null) => T,
): T {
	key = LOCAL_STORAGE_NAMESPACE + ':' + key;
	const stored = localStorage.getItem(key);
	return readTransformer ? readTransformer(stored) : (stored as T);
}

export function setLocalStorage<T>(
	key: string,
	value: T,
	writeTransformer: (value: T) => string | null,
): void {
	key = LOCAL_STORAGE_NAMESPACE + ':' + key;

	const oldValue = localStorage.getItem(key);
	const newValue = writeTransformer(value);

	if (newValue === null) {
		localStorage.removeItem(key);
	} else {
		if (oldValue === newValue) {
			return;
		}
		localStorage.setItem(key, newValue);
	}

	window.dispatchEvent(
		new StorageEvent('storage', {
			key,
			newValue,
			oldValue,
		}),
	);
}
