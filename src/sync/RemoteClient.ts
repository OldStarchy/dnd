import { z } from 'zod';
import { hostNotificationSpec } from './host-message/HostNotification';
import { type HostResponse } from './host-message/HostResponse';
import { type MemberNotification } from './member-message/MemberNotification';
import type { MemberRequest } from './member-message/MemberRequest';
import { RemoteApi } from './RemoteApi';
import { serverNotificationSpec } from './server-message/ServerNotification';
import type { TransportFactory } from './Transport';

const notificationSpec = hostNotificationSpec.or(serverNotificationSpec);
export type HostOrServerNotification = z.infer<typeof notificationSpec>;

// Server Request and Response schemas (currently empty but can be extended)
const hostRequestSchema = z.any();
const memberResponseSchema = z.any(); // TODO: Replace with more specific schema

export type HostRequest = z.infer<typeof hostRequestSchema>;
export type MemberResponse = z.infer<typeof memberResponseSchema>;

export interface ClientHandler {
	handleNotification(
		this: RemoteClient,
		notification: HostOrServerNotification,
	): void;
	handleRequest(
		this: RemoteClient,
		request: HostRequest,
	): Promise<MemberResponse>;
	handleClose(this: RemoteClient): void;
}

export class RemoteClient extends RemoteApi<
	HostRequest,
	MemberResponse,
	MemberRequest,
	HostResponse,
	MemberNotification,
	HostOrServerNotification
> {
	constructor(
		transportFactory: TransportFactory<string>,
		handler: ClientHandler,
	) {
		super(
			hostRequestSchema,
			memberResponseSchema,
			notificationSpec,
			transportFactory,
			handler,
		);
	}
}
