import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import z from 'zod';
import { LocalStorageCollection } from './LocalStorageCollection';

describe('Collection', () => {
	let store: { [key: string]: string } = {};
	beforeAll(() => {
		const localStorageMock = (() => {
			return {
				getItem: (key: string) => store[key] || null,
				setItem: (key: string, value: string) => {
					store[key] = value.toString();
				},
				clear: () => {
					for (const key in store) {
						delete store[key];
					}
				},
			};
		})();

		Object.defineProperty(globalThis, 'localStorage', {
			value: localStorageMock,
		});
	});

	beforeEach(() => {
		store = {};
	});

	it('constructs', () => {
		const collection = new LocalStorageCollection(
			'test',
			() => true,
			z.object({
				id: z.string(),
				revision: z.number(),
			}),
		);

		expect(collection).toBeInstanceOf(LocalStorageCollection);
		expect(collection).toHaveProperty('storageKey', 'test');
	});

	it('can create a new item', async () => {
		const collection = new LocalStorageCollection(
			'test',
			() => true,
			z.object({
				id: z.string(),
				revision: z.number(),
				name: z.string(),
			}),
		);

		const newItem = { name: 'Test Item' };
		await collection.create(newItem);

		const items = await collection.get();
		expect(items).toHaveLength(1);
		expect(items[0].data.getValue()).toHaveProperty('name', 'Test Item');
	});

	it('returns the same item for the same id', async () => {
		const collection = new LocalStorageCollection(
			'test',
			() => true,
			z.object({
				id: z.string(),
				revision: z.number(),
				name: z.string(),
			}),
		);

		const newItem = { name: 'Test Item' };
		const createdItem = await collection.create(newItem);

		const fetchedItem = await collection.getOne({
			id: createdItem.data.getValue().id,
		});
		expect(fetchedItem).toEqual(createdItem);
	});

	it('updates an existing item', async () => {
		const collection = new LocalStorageCollection(
			'test',
			(item, filter?: { id: string }) => !filter || item.id === filter.id,
			z.object({
				id: z.string(),
				revision: z.number(),
				name: z.string(),
			}),
		);

		await collection.create({ name: 'Test Item 1' });
		const createdItem = await collection.create({ name: 'Test Item 2' });

		await createdItem.update({
			merge: { name: { replace: 'Updated Item' } },
		});

		const fetchedItem = await collection.getOne({
			id: createdItem.data.getValue().id,
		});
		expect(fetchedItem?.data.getValue()).toHaveProperty(
			'name',
			'Updated Item',
		);
	});

	it('deletes an item', async () => {
		const collection = new LocalStorageCollection(
			'test',
			() => true,
			z.object({
				id: z.string(),
				revision: z.number(),
				name: z.string(),
			}),
		);

		const createdItem = await collection.create({ name: 'Test Item' });
		await createdItem.delete();

		const items = await collection.get();
		expect(items).toHaveLength(0);
	});

	// TODO: need to use rxjs test stuff
	it('updates an item with a new revision', async () => {
		const collection = new LocalStorageCollection(
			'test',
			() => true,
			z.object({
				id: z.string(),
				revision: z.number(),
				name: z.string(),
			}),
		);

		const createdItem = await collection.create({ name: 'Test Item' });
		const initialRevision = createdItem.data.getValue().revision;

		await createdItem.update({
			merge: { name: { replace: 'Updated Item' } },
		});

		expect(createdItem.data.getValue().revision).toBe(initialRevision + 1);
		expect(createdItem.data.getValue().name).toBe('Updated Item');
	});

	it('filters items', async () => {
		const collection = new LocalStorageCollection(
			'test',
			(item, filter?: { name: string }) =>
				!filter || item.name === filter.name,
			z.object({
				id: z.string(),
				revision: z.number(),
				name: z.string(),
			}),
		);

		await collection.create({ name: 'Item 1' });
		await collection.create({ name: 'Item 2' });
		await collection.create({ name: 'Item 1' });

		const filteredItems = await collection.get({ name: 'Item 1' });
		expect(filteredItems).toHaveLength(2);
		expect(filteredItems[0].data.getValue().name).toBe('Item 1');
	});
});
