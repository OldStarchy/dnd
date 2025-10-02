type AtLeastOne<T> = {
	[K in keyof T]-?: Required<Pick<T, K>> &
		Partial<Pick<T, Exclude<keyof T, K>>>;
}[keyof T];

type Replace<T> = { replace: T };
export type Merge<T> =
	T extends Record<string, unknown>
		? { merge: { [K in keyof T]?: ChangeSet<T[K]> } }
		: never;
type ArrayChange<T> =
	T extends Array<infer U>
		?
				| AtLeastOne<{
						extend: U[];
						selected: ({ filter: Filter<U> } & ChangeSet<U>)[];
						remove: Filter<U>[];
						reorder?: never;
				  }>
				| { reorder: Filter<U>[] }
		: never;

type Filter<T> = number | (T extends { id: infer U } ? { id: U } : never);

export type ChangeSet<T> =
	| undefined
	| Replace<T>
	| Merge<T>
	| (ArrayChange<T> & { replace?: undefined });

function isReplace<T>(value: ChangeSet<T>): value is Replace<T> {
	return typeof value === 'object' && 'replace' in value;
}
function isMerge<T>(value: ChangeSet<T>): value is Merge<T> {
	return typeof value === 'object' && 'merge' in value;
}

/**
 * Creates a copy of `current` with the changes applied from `update`.
 *
 * If there are no changes, the original input is returned.
 */
export function applyChangeset<T>(
	current: Readonly<T>,
	update: ChangeSet<T>,
): T {
	if (update === undefined) {
		return current;
	}

	if (isReplace(update)) {
		return update.replace;
	}

	if (isMerge(update)) {
		let anyChanged = false;
		const merged = { ...current } as T;
		for (const key in update.merge) {
			if (update.merge[key] === undefined) continue;

			const newVal = applyChangeset(
				merged[key],
				update.merge[key],
			) as T[typeof key];

			if (newVal !== merged[key]) {
				anyChanged = true;
				merged[key] = newVal;
			}
		}

		if (!anyChanged) {
			return current;
		}

		return merged;
	}

	if (Array.isArray(current)) {
		let anyChanged = false;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let merged = [...current] as T & any[];

		const hasSelected = 'selected' in update;
		const hasRemove = 'remove' in update;
		const hasReorder = 'reorder' in update;
		const hasExtend = 'extend' in update;

		if ((hasSelected || hasRemove) && hasReorder) {
			throw new Error(
				"Cannot use 'selected' or 'remove' with 'reorder' in array changeset",
			);
		}

		if (hasSelected) {
			for (const item of update.selected!) {
				let filter = item.filter as Filter<T>;
				const change = item as ChangeSet<T>;

				if (typeof filter === 'object') {
					filter = merged.findIndex(
						(v) => v.id == (filter as { id: unknown }).id,
					);
					if (filter == -1) continue;
				}

				const newVal = applyChangeset(merged[filter], change);
				if (newVal !== merged[filter]) {
					anyChanged = true;
					merged[filter] = newVal;
				}
			}
		}

		if (hasRemove) {
			const removals: number[] = [];
			for (let filter of update.remove! as Filter<T>[]) {
				if (typeof filter === 'object') {
					filter = merged.findIndex(
						(v) => v.id == (filter as { id: unknown }).id,
					);
					if (filter == -1) continue;
				}
				removals.push(filter as number);
			}

			if (removals.length > 0) {
				anyChanged = true;

				merged = merged.filter(
					(_, index) => !removals.includes(index),
				) as typeof merged;
			}
		}

		if (hasSelected || hasRemove) {
			if (anyChanged) return merged;
			return current;
		}

		if (hasReorder) {
			if (!Array.isArray(current)) {
				throw new Error('Cannot reorder a non-array type');
			}
			const reorder = update.reorder!.map((filter: Filter<T>) => {
				if (typeof filter === 'number') {
					return filter;
				} else if ('id' in filter) {
					const index = merged.findIndex(
						(item) => item['id'] === filter.id,
					);
					if (index === -1) {
						throw new Error(
							`Item with id ${filter.id} not found for reorder`,
						);
					}
					return index;
				}
				throw new Error('Invalid filter type for reorder');
			});

			if (reorder.length !== merged.length) {
				throw new Error(
					'Reorder length does not match current array length',
				);
			}

			if (reorder.every((v, i) => v === i)) {
				return current;
			}

			const newOrder = reorder.map((filter: number) => merged[filter]);
			return newOrder as T;
		} else if (hasExtend) {
			return [...merged, ...update.extend] as typeof merged;
		}
	}

	throw new Error('Invalid update type');
}
