import { z } from 'zod';
import type { HostNotification } from './host-message/HostNotification';
import {
	memberNotificationSpec,
	type MemberNotification,
} from './member-message/MemberNotification';
import { RemoteApi } from './RemoteApi';
import { serverNotificationSpec } from './server-message/ServerNotification';
import type { TransportFactory } from './Transport';

// Server Request and Response schemas (currently empty but can be extended)
const hostRequestSchema = z.any();
const memberResponseSchema = z.any(); // TODO: Replace with more specific schema

export type HostRequest = z.infer<typeof hostRequestSchema>;
export type MemberResponse = z.infer<typeof memberResponseSchema>;

const notificationSpec = memberNotificationSpec.or(serverNotificationSpec);
export type MemberOrServerNotification = z.infer<typeof notificationSpec>;

export interface ServerHandler {
	handleNotification(
		this: RemoteServer,
		notification: MemberOrServerNotification,
	): void;
	handleRequest(
		this: RemoteServer,
		request: HostRequest,
	): Promise<MemberResponse>;
	handleClose(this: RemoteServer): void;
}

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
					handler.handleNotification.call(this, notification);
				},
				handleRequest(request: HostRequest): Promise<MemberResponse> {
					return handler.handleRequest.call(this, request);
				},
				handleClose(): void {
					handler.handleClose.call(this);
				},
			},
		);
	}
}
