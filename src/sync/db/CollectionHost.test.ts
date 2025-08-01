import { RamCollection } from '@/db/RamCollection';
import { describe, expect, it } from 'vitest';
import { CollectionHost } from './CollectionHost';
import {
	type DbNotificationMessages,
	type DbRequestMessages,
	type DbResponseMessages,
} from './Messages';
import { createPoviderConnection, typeSchema, type Record } from './testUtil';

describe('CollectionHost', () => {
	it("doesn't throw on instantiation", () => {
		const source = new RamCollection<Record, void>(
			'test',
			() => true,
			typeSchema,
		);

		new CollectionHost<Record>(source);
	});

	it('responds to get requests', async () => {
		const source = new RamCollection<Record, void>(
			'test',
			() => true,
			typeSchema,
		);

		const host = new CollectionHost<Record>(source);

		const { connection, port } = createPoviderConnection();

		const unsub = host.provide(connection);

		port.postMessage(
			JSON.stringify({
				type: 'request',
				id: '1',
				data: {
					type: 'db',
					collection: 'test',
					action: 'get',
				} as DbRequestMessages<Record>,
			}),
		);

		const message = await new Promise<DbResponseMessages<Record>>(
			(resolve) => {
				port.addEventListener('message', (event) => {
					const data = JSON.parse(
						event.data,
					) as DbResponseMessages<Record>;
					resolve(data);
				});
			},
		);

		expect(message).toEqual({
			type: 'response',
			id: '1',
			data: {
				type: 'db',
				collection: 'test',
				action: 'get',
				data: [],
			},
		});
	});

	it('notifies of updates', async () => {
		const source = new RamCollection<Record, void>(
			'test',
			() => true,
			typeSchema,
		);

		const host = new CollectionHost<Record>(source);

		const { connection, port } = createPoviderConnection();

		const unsub = host.provide(connection);

		const messageProm = new Promise<DbResponseMessages<Record>>(
			(resolve) => {
				port.addEventListener('message', (event) => {
					const data = JSON.parse(
						event.data,
					) as DbResponseMessages<Record>;
					resolve(data);
				});
			},
		);

		const creature = await source.create({
			name: 'Test Creature',
		});

		const message = await messageProm;

		expect(message).toEqual({
			type: 'notification',
			data: {
				type: 'db',
				collection: 'test',
				items: [
					{
						id: creature.data.getValue().id,
						revision: creature.data.getValue().revision,
						name: 'Test Creature',
					},
				],
			} as DbNotificationMessages<Record>,
		});
	});
});
