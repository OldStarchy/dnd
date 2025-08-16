import z from 'zod';
import {
	collectionNotificationSchema,
	collectionRequestSchema,
	collectionResponseSchema,
} from '../db/Messages';
import type { MessageOfType } from './MessageOfType';
import {
	notificationSchemaFactory,
	requestSchemaFactory,
	responseSchemaFactory,
} from './schema/schemaFactory';

export const userMessageSchema = z.discriminatedUnion('type', [
	requestSchemaFactory(collectionRequestSchema),
	responseSchemaFactory(collectionResponseSchema),
	notificationSchemaFactory(collectionNotificationSchema),
]);

export type UserMessage = z.infer<typeof userMessageSchema>;
export type UserMessageOfType<T extends UserMessage['type']> = MessageOfType<
	UserMessage,
	T
>;
