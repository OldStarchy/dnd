import type { Dispatch } from 'react';
import z from 'zod';

import useLocalStorage, {
	getLocalStorage,
	setLocalStorage,
} from '@/hooks/useLocalStorage';
import Logger from '@/lib/log';
import { Err, Ok, type Result } from '@/lib/Result';

function writeTransformer<T>(): (value: T) => string {
	return (value: T) => JSON.stringify(value);
}

function readTransformer<Schema extends z.ZodType>(
	defaultValue: z.input<Schema>,
	schema: Schema,
): (
	stored: string | null,
) => Result<
	z.output<Schema>,
	{ error: z.ZodError<z.output<Schema>>; defaultValue: z.output<Schema> }
> {
	return (stored: string | null) => {
		if (stored === null) return Ok(schema.parse(defaultValue));

		const data = JSON.parse(stored) as unknown;

		const parsed = schema.safeParse(data);
		if (!parsed.success) {
			return Err({
				error: parsed.error,
				defaultValue: schema.parse(defaultValue),
			});
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
function useJsonStorage<
	TKey extends keyof LocalStorageKeys,
	Schema extends z.ZodType<LocalStorageKeys[TKey]>,
>(key: TKey, defaultValue: z.input<Schema>, schema: Schema) {
	const read = readTransformer(defaultValue, schema);
	const write = writeTransformer<z.output<Schema>>();

	return useLocalStorage<TKey, z.output<Schema>>(
		key,
		(stored) => {
			return read(stored).unwrapOrElse(({ error, defaultValue }) => {
				Logger.warn(
					`Failed to parse localStorage key '${key}' with value. Used default.`,
					{ input: stored, errors: z.treeifyError(error).errors },
				);
				return defaultValue;
			});
		},
		write,
	) as [
		z.output<Schema>,
		Dispatch<
			z.input<Schema> | ((prev: z.output<Schema>) => z.input<Schema>)
		>,
	];
}

export default useJsonStorage;

export function getJsonStorage<
	TKey extends keyof LocalStorageKeys,
	Schema extends z.ZodType<LocalStorageKeys[TKey]>,
>(key: TKey, defaultValue: z.input<Schema>, schema: Schema): z.output<Schema> {
	const read = readTransformer(defaultValue, schema);

	return getLocalStorage(key, (stored) => {
		return read(stored).unwrapOrElse(({ error, defaultValue }) => {
			Logger.warn(
				`Failed to parse localStorage key '${key}' with value. Used default.`,
				{ input: stored, errors: z.treeifyError(error).errors },
			);
			return defaultValue;
		});
	});
}

export function setJsonStorage<TKey extends keyof LocalStorageKeys>(
	key: TKey,
	value: LocalStorageKeys[TKey],
): void {
	const write = writeTransformer<LocalStorageKeys[TKey]>();

	setLocalStorage(key, value, write);
}
