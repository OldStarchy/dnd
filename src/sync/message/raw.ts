import z from 'zod';

import {
	collectionNotificationSchema,
	collectionRequestSchema,
	collectionResponseSchema,
} from '@/sync/db/Messages';
import type { MessageOfType } from '@/sync/message/MessageOfType';
import {
	notificationSchemaFactory,
	requestSchemaFactory,
	responseSchemaFactory,
} from '@/sync/message/schema/schemaFactory';

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
