import { RamCollection } from '@/db/RamCollection';
import z from 'zod';
import { RemoteApi } from '../RemoteApi';
import { PortTransport } from '../transports/PortTransport';
import { CollectionHost } from './CollectionHost';
import {
	createCollectionNotificationSchema,
	createCollectionRequestSchema,
	createCollectionResponseSchema,
	type DbNotificationMessages,
	type DbRequestMessages,
	type DbResponseMessages,
} from './Messages';
import RemoteCollection from './RemoteCollection';

export const typeSchema = z.object({
	id: z.string(),
	revision: z.number(),
	name: z.string(),
});

export const requestSchema = createCollectionRequestSchema(
	'test',
	typeSchema.omit({
		id: true,
		revision: true,
	}),
);
export const responseSchema = createCollectionResponseSchema(
	'test',
	typeSchema,
);
export const notificationSchema = createCollectionNotificationSchema(
	'test',
	typeSchema,
);

export type Record = z.infer<typeof typeSchema>;

export function createPoviderConnection() {
	const channel = new MessageChannel();

	channel.port1.start();
	channel.port2.start();

	return {
		connection: createProviderApi(channel.port1),
		port: channel.port2,
	} as const;
}

export function createProviderApi(port: MessagePort) {
	return new RemoteApi<
		void,
		void,
		DbRequestMessages<Record>,
		DbResponseMessages<Record>,
		DbNotificationMessages<Record>,
		void
	>(
		requestSchema,
		z.any(),
		z.any(),

		new PortTransport(port),
	);
}

export function createConsumerConnection() {
	const channel = new MessageChannel();

	channel.port1.start();
	channel.port2.start();

	return {
		connection: createConsumerApi(channel.port1),
		port: channel.port2,
	} as const;
}

export function createConsumerApi(port: MessagePort) {
	return new RemoteApi<
		DbRequestMessages<Record>,
		DbResponseMessages<Record>,
		void,
		void,
		void,
		DbNotificationMessages<Record>
	>(
		z.any(),
		responseSchema,
		notificationSchema,

		new PortTransport(port),
	);
}

export function createConnectionPair() {
	const channel = new MessageChannel();

	channel.port1.start();
	channel.port2.start();

	return {
		provider: createProviderApi(channel.port1),
		consumer: createConsumerApi(channel.port2),
	} as const;
}

export function createRamBackedRemoteCollection(name: string) {
	const { provider, consumer } = createConnectionPair();

	const source = new RamCollection<Record, void>(
		name,
		() => true,
		typeSchema,
	);

	const host = new CollectionHost<Record>(source);

	host.provide(provider);

	const collection = new RemoteCollection(consumer, name);

	return collection;
}
