import type { Dispatch, SetStateAction } from 'react';
import useLocalStorage from './useLocalStorage';

function useJsonStorage<T>(key: string, defaultValue: T) {
	return useLocalStorage<T>(
		key,
		(stored) =>
			stored === null
				? defaultValue
				: ((JSON.parse(stored) as T) ?? defaultValue),
		(v) => JSON.stringify(v),
	) as [T, Dispatch<SetStateAction<T>>];
}

export default useJsonStorage;
