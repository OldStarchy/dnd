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
function useLocalStorage(
	key: string,
	defaultValue: string,
): [string | null, Dispatch<SetStateAction<string | null>>];
function useLocalStorage(
	key: string,
	defaultValue: string | null = null,
): [string | null, Dispatch<SetStateAction<string | null>>] {
	const [value, setValue] = useState<string | null>(
		localStorage.getItem(key) ?? defaultValue,
	);

	const setStoredValue = useCallback(
		(
			newValueOrCallback:
				| string
				| null
				| ((oldValue: string | null) => string | null),
		) => {
			const cb =
				typeof newValueOrCallback === 'function'
					? newValueOrCallback
					: () => newValueOrCallback as string | null;

			const newValue = cb(localStorage.getItem(key));
			if (newValue === null) {
				localStorage.removeItem(key);
			} else {
				localStorage.setItem(key, newValue);
			}

			window.dispatchEvent(
				new StorageEvent('storage', {
					key,
					newValue,
					oldValue: value,
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

	return [value, setStoredValue];
}

export default useLocalStorage;
