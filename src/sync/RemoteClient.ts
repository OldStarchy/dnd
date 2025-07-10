import {
	hostNotificationSpec,
	type ServerNotification,
} from './host-message/HostNotification';
import {
	hostResponseSpec,
	type HostResponse,
} from './host-message/HostResponse';
import type { MemberNotification } from './member-message/MemberNotification';
import {
	memberRequestSchema,
	type MemberRequest,
} from './member-message/MemberRequest';
import { RemoteApi } from './RemoteApi';
import type { TransportFactory } from './Transport';

export interface ClientHandler {
	handleNotification(notification: ServerNotification): void;
	handleClose(): void;
}

export class RemoteClient extends RemoteApi<
	MemberRequest,
	HostResponse,
	MemberNotification,
	ServerNotification
> {
	constructor(
		transportFactory: TransportFactory<string>,
		handler: ClientHandler,
	) {
		super(
			memberRequestSchema,
			hostResponseSpec,
			hostNotificationSpec,
			transportFactory,
			{
				handleNotification(notification: ServerNotification): void {
					handler.handleNotification(notification);
				},
				handleRequest(): Promise<HostResponse> {
					// Clients don't handle requests in this architecture
					throw new Error('Clients should not receive requests');
				},
				handleClose(): void {
					handler.handleClose();
				},
			},
		);
	}
}
