import { z } from 'zod';
import type { HostNotification } from './host-message/HostNotification';
import {
	memberNotificationSpec,
	type MemberNotification,
} from './member-message/MemberNotification';
import { RemoteApi } from './RemoteApi';
import type { TransportFactory } from './Transport';

// Server Request and Response schemas (currently empty but can be extended)
const hostRequestSchema = z.any();
const memberResponseSchema = z.any(); // TODO: Replace with more specific schema

export type HostRequest = z.infer<typeof hostRequestSchema>;
export type MemberResponse = z.infer<typeof memberResponseSchema>;

export interface ServerHandler {
	handleNotification(notification: MemberNotification): void;
	handleRequest(request: HostRequest): Promise<MemberResponse>;
	handleClose(): void;
}

const serverNotificationSpec = z.union([
	z.object({
		type: z.literal('userJoined'),
		token: z.string(),
	}),
	z.object({
		type: z.literal('connectionReplaced'),
	}),
]);
const notificationSpec = memberNotificationSpec.or(serverNotificationSpec);

export type MemberOrServerNotification = z.infer<typeof notificationSpec>;
export class RemoteServer extends RemoteApi<
	HostRequest,
	MemberResponse,
	HostNotification,
	MemberOrServerNotification
> {
	constructor(
		transportFactory: TransportFactory<string>,
		handler: ServerHandler,
	) {
		super(
			hostRequestSchema,
			memberResponseSchema,
			notificationSpec,
			transportFactory,
			{
				handleNotification(notification: MemberNotification): void {
					handler.handleNotification(notification);
				},
				handleRequest(request: HostRequest): Promise<MemberResponse> {
					return handler.handleRequest(request);
				},
				handleClose(): void {
					handler.handleClose();
				},
			},
		);
	}
}
