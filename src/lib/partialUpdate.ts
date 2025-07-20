export type Replace<T> = { value: T };
export type Merge<T> =
	T extends Record<string, unknown>
		? {
				merge: {
					[key in keyof T]?: UpdateFor<T[key]>;
				};
			}
		: never;

export type Extend<T> =
	T extends Array<unknown>
		? {
				extend: T;
			}
		: never;

export type UpdateFor<T> = undefined | Replace<T> | Merge<T> | Extend<T>;

function isReplace<T>(value: UpdateFor<T>): value is Replace<T> {
	return typeof value === 'object' && 'value' in value;
}
function isMerge<T>(value: UpdateFor<T>): value is Merge<T> {
	return typeof value === 'object' && 'merge' in value;
}
function isExtend<T>(value: UpdateFor<T>): value is Extend<T> {
	return typeof value === 'object' && 'extend' in value;
}

export function partialUpdate<T>(current: T, update: UpdateFor<T>): T {
	if (update === undefined) {
		return current;
	}

	if (isReplace(update)) {
		return update.value;
	}

	if (isMerge(update)) {
		const merged = { ...current } as T & Record<keyof T, unknown>;
		for (const key in update.merge) {
			if (update.merge[key] === undefined) continue;

			merged[key] = partialUpdate(merged[key], update.merge[key]);
		}
		return merged;
	}

	if (isExtend(update)) {
		if (current === undefined) {
			return [...update.extend] as T;
		}
		if (!Array.isArray(current)) {
			throw new Error('Cannot extend a non-array type');
		}
		if (!Array.isArray(update.extend)) {
			throw new Error('Cannot extend with a non-array type');
		}
		return [...current, ...update.extend] as T;
	}

	throw new Error('Invalid update type');
}
