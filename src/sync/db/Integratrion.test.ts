import { RamCollection } from '@/db/RamCollection';
import { firstValueFrom, skip } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { CollectionHost } from './CollectionHost';
import RemoteCollection from './RemoteCollection';
import { createConnectionPair, type Record, typeSchema } from './testUtil';

describe('Integration Tests', () => {
	it('works', async () => {
		const { provider, consumer } = createConnectionPair();

		const source = new RamCollection('test', () => true, typeSchema);

		const host = new CollectionHost<'test', Record>(source);

		host.provide(provider);

		const collection = new RemoteCollection(consumer, 'test');

		const item = await collection.create({
			name: 'Test Creature',
		});

		const sourceItems = await source.get();
		expect(sourceItems).toHaveLength(1);

		const sourceItem = sourceItems[0];

		const itemUpdateProm = firstValueFrom(item.data.pipe(skip(1)));

		await sourceItem.update({
			merge: { name: { replace: 'Updated Creature' } },
		});

		const updatedItem = await itemUpdateProm;

		expect(updatedItem.name).toBe('Updated Creature');
	});
});
