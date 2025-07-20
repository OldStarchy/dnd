import {z} from 'zod';
import type {HostNotification} from './host-message/HostNotification';
import {
	hostResponseSchema,
	type HostResponse,
} from './host-message/HostResponse';
import {memberNotificationSpec} from './member-message/MemberNotification';
import {
	memberRequestSchema,
	type MemberRequest,
} from './member-message/MemberRequest';
import {RemoteApi} from './RemoteApi';
import type {HostRequest, MemberResponse} from './RemoteClient';
import {serverNotificationSpec} from './server-message/ServerNotification';
import type {TransportFactory} from './Transport';

const notificationSpec = memberNotificationSpec.or(serverNotificationSpec);
export type MemberOrServerNotification = z.infer<typeof notificationSpec>;


export class RemoteServer extends RemoteApi<
	MemberRequest,
	HostResponse,
	HostRequest,
	MemberResponse,
	HostNotification,
	MemberOrServerNotification
> {
	constructor(
		transportFactory: TransportFactory<string>,
	) {
		super(
			memberRequestSchema,
			hostResponseSchema,
			notificationSpec,
			transportFactory,
		);
	}
}
