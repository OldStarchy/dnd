import type { Dispatch, SetStateAction } from 'react';
import useLocalStorage from './useLocalStorage';

function useJsonStorage<TKey extends keyof LocalStorageKeys, TValue>(
	key: TKey,
	defaultValue: TValue,
) {
	return useLocalStorage<TKey, TValue>(
		key,
		(stored) =>
			stored === null
				? defaultValue
				: ((JSON.parse(stored) as TValue) ?? defaultValue),
		(v) => JSON.stringify(v),
	) as [TValue, Dispatch<SetStateAction<TValue>>];
}

export default useJsonStorage;
