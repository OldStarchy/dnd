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
import type { TransportFactory } from './Transport';

export interface ClientHandler {
	handleNotification(
		this: RemoteClient,
		notification: HostNotification,
	): void;
	handleClose(this: RemoteClient): void;
}

export class RemoteClient extends RemoteApi<
	MemberRequest,
	HostResponse,
	MemberNotification,
	HostNotification
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
