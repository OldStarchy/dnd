import { LOCAL_STORAGE_NAMESPACE } from '@/const';
import { Err, Ok, type Result } from '@/lib/Result';
import type { Dispatch, SetStateAction } from 'react';
import type z from 'zod';
import useLocalStorage, {
	getLocalStorage,
	setLocalStorage,
} from './useLocalStorage';

function writeTransformer<T>(): (value: T) => string {
	return (value: T) => JSON.stringify(value);
}

function readTransformer<T>(
	defaultValue: T,
	schema: z.ZodType<T>,
): (stored: string | null) => Result<T, z.ZodError<T>> {
	return (stored: string | null) => {
		if (stored === null) return Ok(defaultValue);

		const data = JSON.parse(stored) as unknown;

		const parsed = schema.safeParse(data);
		if (!parsed.success) {
			return Err(parsed.error);
		}

		return Ok(parsed.data);
	};
}

/**
 * A storage for JSON-serializable values in local storage.
 *
 * The values are validated with the provided Zod schema when reading them back.
 * If the validation fails, the default value is returned instead.
 *
 * The key will automatically be prefixed with {@link LOCAL_STORAGE_NAMESPACE}.
 */
function useJsonStorage<TKey extends keyof LocalStorageKeys, TValue>(
	key: TKey,
	defaultValue: TValue,
	schema: z.ZodType<TValue>,
) {
	const read = readTransformer(defaultValue, schema);
	const write = writeTransformer<TValue>();

	return useLocalStorage<TKey, TValue>(
		key,
		(stored) => {
			return read(stored)
				.inspectErr((err) => {
					console.error(
						'Failed to parse localStorage key',
						key,
						'with value',
						stored,
						'error:',
						err,
					);
				})
				.unwrapOr(defaultValue);
		},
		write,
	) as [TValue, Dispatch<SetStateAction<TValue>>];
}

export default useJsonStorage;

export function getJsonStorage<TKey extends keyof LocalStorageKeys, TValue>(
	key: TKey,
	defaultValue: TValue,
	schema: z.ZodType<TValue>,
): TValue {
	const read = readTransformer(defaultValue, schema);

	return getLocalStorage(key, (stored) => {
		return read(stored)
			.inspectErr((err) => {
				console.error(
					'Failed to parse localStorage key',
					key,
					'with value',
					stored,
					'error:',
					err,
				);
			})
			.unwrapOr(defaultValue);
	});
}

export function setJsonStorage<TKey extends keyof LocalStorageKeys>(
	key: TKey,
	value: LocalStorageKeys[TKey],
): void {
	const write = writeTransformer<LocalStorageKeys[TKey]>();

	setLocalStorage(key, value, write);
}
