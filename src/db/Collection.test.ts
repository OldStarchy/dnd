import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import z from 'zod';

import { Db } from '@/sync/room/RoomApi';

import { DocumentApi } from './Collection';
import { LocalStorageCollection } from './LocalStorageCollection';
import { defineRecordType, type RecordType } from './RecordType';

const TestDocumentSchema = z.object({
	id: z.string(),
	revision: z.number(),
	name: z.string(),
});

type TestDocument = z.infer<typeof TestDocumentSchema>;
type TestDocumentFilter = { id?: string; name?: string };
type TestRecordType = RecordType<TestDocument, TestDocumentFilter>;

const TestCollectionSchema = defineRecordType({
	name: 'test',
	schema: TestDocumentSchema,
	filterFn: (item, filter) =>
		item.id === filter.id || item.name === filter.name,
	documentClass: DocumentApi<RecordType<TestDocument, TestDocumentFilter>>,
});

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
		const collection = new LocalStorageCollection<TestRecordType>(
			TestCollectionSchema,
			new Db(),
		);

		expect(collection).toBeInstanceOf(LocalStorageCollection);
		expect(collection).toHaveProperty('storageKey', 'dnd.db.test');
	});

	it('can create a new item', async () => {
		const collection = new LocalStorageCollection<TestRecordType>(
			TestCollectionSchema,
			new Db(),
		);

		const newItem = { name: 'Test Item' };
		await collection.create(newItem);

		const items = await collection.get();
		expect(items).toHaveLength(1);
		expect(items[0].data).toHaveProperty('name', 'Test Item');
	});

	it('returns the same item for the same id', async () => {
		const collection = new LocalStorageCollection<TestRecordType>(
			TestCollectionSchema,
			new Db(),
		);

		const newItem = { name: 'Test Item' };
		const createdItem = await collection.create(newItem);

		const fetchedItem = await collection
			.getOne({
				id: createdItem.data.id,
			})
			.unwrapOrNull();
		expect(fetchedItem).toBe(createdItem);
	});

	it('updates an existing item', async () => {
		const collection = new LocalStorageCollection<TestRecordType>(
			TestCollectionSchema,
			new Db(),
		);

		await collection.create({ name: 'Test Item 1' });
		const createdItem = await collection.create({ name: 'Test Item 2' });

		await createdItem.update({
			merge: { name: { replace: 'Updated Item' } },
		});

		const fetchedItem = await collection.getOne({
			id: createdItem.data.id,
		});
		expect(fetchedItem.unwrapOrNull()?.data).toHaveProperty(
			'name',
			'Updated Item',
		);
	});

	it('deletes an item', async () => {
		const collection = new LocalStorageCollection<TestRecordType>(
			TestCollectionSchema,
			new Db(),
		);

		const createdItem = await collection.create({ name: 'Test Item' });
		await createdItem.delete();

		const items = await collection.get();
		expect(items).toHaveLength(0);
	});

	// TODO: need to use rxjs test stuff
	it('updates an item with a new revision', async () => {
		const collection = new LocalStorageCollection<TestRecordType>(
			TestCollectionSchema,
			new Db(),
		);

		const createdItem = await collection.create({ name: 'Test Item' });
		const initialRevision = createdItem.data.revision;

		await createdItem.update({
			merge: { name: { replace: 'Updated Item' } },
		});

		expect(createdItem.data.revision).toBe(initialRevision + 1);
		expect(createdItem.data.name).toBe('Updated Item');
	});

	it('filters items', async () => {
		const collection = new LocalStorageCollection<TestRecordType>(
			TestCollectionSchema,
			new Db(),
		);

		await collection.create({ name: 'Item 1' });
		await collection.create({ name: 'Item 2' });
		await collection.create({ name: 'Item 1' });

		const filteredItems = await collection.get({ name: 'Item 1' });
		expect(filteredItems).toHaveLength(2);
		expect(filteredItems[0].data.name).toBe('Item 1');
	});
});
