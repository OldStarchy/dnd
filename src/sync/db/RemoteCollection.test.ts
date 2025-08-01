import { describe, expect, it } from 'vitest';

import { firstValueFrom, skip } from 'rxjs';
import {
	type DbNotificationMessages,
	type DbRequestMessages,
	type DbResponseMessages,
} from './Messages';
import RemoteCollection from './RemoteCollection';
import { createConsumerConnection, type Record } from './testUtil';

describe('RemoteCollection', () => {
	it("doesn't throw on instantiation", () => {
		const { connection } = createConsumerConnection();
		const collection = new RemoteCollection(connection, 'test');
		expect(collection).toBeInstanceOf(RemoteCollection);
	});

	it('forwards requests to the remote', async () => {
		const { connection, port } = createConsumerConnection();
		const collection = new RemoteCollection(connection, 'test');

		const messages: unknown[] = [];
		port.addEventListener('message', (event) => {
			const data = JSON.parse(event.data) as {
				type: 'request';
				id: string;
				data: DbRequestMessages<Record>;
			};
			messages.push(data);

			port.postMessage(
				JSON.stringify({
					type: 'response',
					id: data.id,
					data: {
						type: 'db',
						action: 'getOne',
						collection: 'test',
						data: { id: '123', revision: 1, name: 'Test Creature' },
					} as DbResponseMessages<Record>,
				}),
			);
		});

		const data = await collection.getOne();
		expect(messages).toEqual([
			{
				type: 'request',
				id: expect.any(String),
				data: {
					type: 'db',
					action: 'getOne',
					collection: 'test',
					filter: undefined,
				} as DbRequestMessages<Record>,
			},
		]);
		expect(data?.data.getValue()).toEqual({
			id: '123',
			revision: 1,
			name: 'Test Creature',
		});
	});

	it('updates on notifications', async () => {
		const { connection, port } = createConsumerConnection();
		const collection = new RemoteCollection(connection, 'test');

		port.addEventListener('message', (event) => {
			const data = JSON.parse(event.data) as {
				type: 'request';
				id: string;
				data: DbRequestMessages<Record>;
			};

			port.postMessage(
				JSON.stringify({
					type: 'response',
					id: data.id,
					data: {
						type: 'db',
						action: 'getOne',
						collection: 'test',
						data: { id: '123', revision: 1, name: 'Test Creature' },
					} as DbResponseMessages<Record>,
				}),
			);
		});

		const data = await collection.getOne();
		expect(data!.data.getValue()).toEqual({
			id: '123',
			revision: 1,
			name: 'Test Creature',
		});

		port.postMessage(
			JSON.stringify({
				type: 'notification',
				data: {
					type: 'db',
					collection: 'test',
					items: [{ id: '123', revision: 2, name: 'Test Banana' }],
				} as DbNotificationMessages<Record>,
			}),
		);

		const updated = await firstValueFrom(data!.data.pipe(skip(1)));

		expect(updated).toEqual({
			id: '123',
			revision: 2,
			name: 'Test Banana',
		});
	});
});
