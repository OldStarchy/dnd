import type z from 'zod';
import {
	hostNotificationSpec,
	type HostNotification,
} from './host-message/HostNotification';
import {
	hostResponseSpec,
	type HostResponse,
} from './host-message/HostResponse';
import { type MemberNotification } from './member-message/MemberNotification';
import {
	memberRequestSchema,
	type MemberRequest,
} from './member-message/MemberRequest';
import { RemoteApi } from './RemoteApi';
import { serverNotificationSpec } from './server-message/ServerNotification';
import type { TransportFactory } from './Transport';

const notificationSpec = hostNotificationSpec.or(serverNotificationSpec);
export type HostOrServerNotification = z.infer<typeof notificationSpec>;

export interface ClientHandler {
	handleNotification(
		this: RemoteClient,
		notification: HostOrServerNotification,
	): void;
	handleClose(this: RemoteClient): void;
}

export class RemoteClient extends RemoteApi<
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
			memberRequestSchema,
			hostResponseSpec,
			notificationSpec,
			transportFactory,
			{
				handleNotification(notification: HostNotification): void {
					handler.handleNotification.call(this, notification);
				},
				handleRequest(): Promise<HostResponse> {
					// Clients don't handle requests in this architecture
					throw new Error('Clients should not receive requests');
				},
				handleClose(): void {
					handler.handleClose.call(this);
				},
			},
		);
	}
}
