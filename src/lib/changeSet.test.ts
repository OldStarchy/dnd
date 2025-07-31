import { describe, expect, it } from 'vitest';
import { applyChangeset } from './changeSet';

describe('ChangeSet', () => {
	it('replaces values', () => {
		const initial = 1;

		const result = applyChangeset(initial, { replace: 4 });
		const expected = 4;

		expect(result).toBe(expected);
	});

	it('merges objects', () => {
		const initial = { a: 1, b: 2 };

		const result = applyChangeset(initial, {
			merge: { b: { replace: 3 } },
		});
		const expected = { a: 1, b: 3 };

		expect(result).toEqual(expected);
	});

	it('merges nested objects', () => {
		const initial = { a: { b: 1 }, c: 2 };

		const result = applyChangeset(initial, {
			merge: { a: { merge: { b: { replace: 3 } } } },
		});
		const expected = { a: { b: 3 }, c: 2 };

		expect(result).toEqual(expected);
	});

	it('applies changes to arrays', () => {
		const initial = [1, 2, 3];

		const result = applyChangeset(initial, {
			selected: [{ filter: 1, replace: 4 }],
		});
		const expected = [1, 4, 3];

		expect(result).toEqual(expected);
	});

	it('removes items from arrays', () => {
		const initial = [1, 2, 3, 4];

		const result = applyChangeset(initial, {
			remove: [1, 3],
		});
		const expected = [1, 3];

		expect(result).toEqual(expected);
	});

	it('reorders items in arrays', () => {
		const initial = [1, 2, 3];
		const result = applyChangeset(initial, {
			reorder: [1, 0, 2],
		});
		const expected = [2, 1, 3];
		expect(result).toEqual(expected);
	});

	it('handles undefined changes', () => {
		const initial = { a: 1, b: 2 };

		const result = applyChangeset(initial, undefined);
		const expected = { a: 1, b: 2 };

		expect(result).toEqual(expected);
	});

	it('returns the same value if no changes are made', () => {
		const initial = { a: 1, b: 2 };

		const result = applyChangeset(initial, { merge: {} });

		expect(result).toBe(initial);
	});

	it('returns the same array if no changes are made', () => {
		const initial = [1, 2, 3];

		const result = applyChangeset(initial, { selected: [] });

		expect(result).toBe(initial);
	});
});
