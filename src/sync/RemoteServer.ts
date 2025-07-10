import { z } from 'zod';
import type { ServerNotification } from './host-message/HostNotification';
import {
	memberNotificationSpec,
	type MemberNotification,
} from './member-message/MemberNotification';
import { RemoteApi } from './RemoteApi';
import type { TransportFactory } from './Transport';

// Server Request and Response schemas (currently empty but can be extended)
const serverRequestSchema = z.object({});
const clientResponseSchema = z.any(); // TODO: Replace with more specific schema

export type ServerRequest = z.infer<typeof serverRequestSchema>;
export type ClientResponse = z.infer<typeof clientResponseSchema>;

export interface ServerHandler {
	handleNotification(notification: MemberNotification): void;
	handleRequest(request: ServerRequest): Promise<ClientResponse>;
	handleClose(): void;
}

export class RemoteServer extends RemoteApi<
	ServerRequest,
	ClientResponse,
	ServerNotification,
	MemberNotification
> {
	constructor(
		transportFactory: TransportFactory<string>,
		handler: ServerHandler,
	) {
		super(
			serverRequestSchema,
			clientResponseSchema,
			memberNotificationSpec,
			transportFactory,
			{
				handleNotification(notification: MemberNotification): void {
					handler.handleNotification(notification);
				},
				handleRequest(request: ServerRequest): Promise<ClientResponse> {
					return handler.handleRequest(request);
				},
				handleClose(): void {
					handler.handleClose();
				},
			},
		);
	}
}
