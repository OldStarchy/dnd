import { BehaviorSubject, filter, map, Observable, scan, Subject } from 'rxjs';
import { CallbackSet, type RemoteApiProvider } from '../RemoteApi';
import { systemNotification, type SystemNotification } from '../RoomEvents';
import type RoomHost from './RoomHost';

type MemberPresence = {
	id: string;
	online: boolean;
};

export default class RoomHostConnection<TUserMessage> {
	readonly host: RoomHost<TUserMessage>;
	readonly ws: WebSocket;
	readonly id: string;
	readonly gameMasterId: string;

	private _notification$ = new Subject<SystemNotification>();
	readonly notification$ = this._notification$.asObservable();

	readonly members$:  BehaviorSubject<MemberPresence[]>;
	readonly messages$: Observable<{ sender: string; data: TUserMessage }>;

	constructor(
		id: string,
		gameMasterId: string,
		members: MemberPresence[],
		host: RoomHost<TUserMessage>,
		ws: WebSocket,
	) {
		this.id = id;
		this.gameMasterId = gameMasterId;
		this.host = host;
		this.ws = ws;

		ws.addEventListener('message', (event) => {
			const data = JSON.parse(event.data);
			const parsed = systemNotification.safeParse(data);
			if (!parsed.success) {
				console.error('Invalid notification format:', parsed.error);
				return;
			}

			this._notification$.next(parsed.data);
		});

		this.members$ = new BehaviorSubject<MemberPresence[]>(members);
		this.notification$
			.pipe(
				scan((members, notification) => {
					switch (notification.type) {
						case 'room.members.joined':
							return [
								...members,
								{ id: notification.data.id, online: false },
							];
						case 'room.members.left':
							return members.filter(
								(m) => m.id !== notification.data.id,
							);
						case 'room.members.presence':
							return members.map((m) =>
								m.id === notification.data.id
									? {
											...m,
											online: notification.data.connected,
										}
									: m,
							);
						default:
							return members;
					}
				}, members),
			)
			.subscribe(this.members$);

		this.messages$ = this.notification$.pipe(
			filter((n) => n.type === 'user.message'),
			map((n) => ({
				sender: n.data.sender,
				validation: this.host.userMessageSchema.safeParse(n.data),
			})),
			filter(
				(
					data,
				): data is typeof data & { validation: { success: true } } =>
					data.validation.success,
			),
			map((data) => ({
				sender: data.sender,
				data: data.validation.data,
			})),
		);
	}

	private _send(message: { to?: string; data: TUserMessage }) {
		if (this.ws.readyState !== WebSocket.OPEN) {
			console.error(
				'WebSocket is not open. Cannot send message:',
				message,
			);
			return;
		}

		const msg = JSON.stringify(message);
		this.ws.send(msg);
	}

	broadcast(message: TUserMessage) {
		this._send({ data: message });
	}

	sendTo(id: string, message: TUserMessage) {
		this._send({ to: id, data: message });
	}

	sendToGm(message: TUserMessage) {
		this._send({ to: this.gameMasterId, data: message });
	}

	close() {
		if (this.ws.readyState === WebSocket.OPEN) {
			this.ws.close();
		}
		this._notification$.complete();
	}

	isOpen(): boolean {
		return this.ws.readyState === WebSocket.OPEN;
	}

	[Symbol.dispose](): void {
		this.close();
	}
}

type RoomHostConnectionForApiProvider<TRequest, TResponse, TNotification> =
	RoomHostConnection<
		| {
				type: 'request';
				id: string;
				data: TRequest;
		  }
		| {
				type: 'response';
				id: string;
				data: TResponse;
		  }
		| {
				type: 'response-error';
				id: string;
				error: string;
		  }
		| {
				type: 'notification';
				data: TNotification;
		  }
	>;

export class RoomHostConnectionApiProvider<TRequest, TResponse, TNotification>
	implements RemoteApiProvider<TRequest, TResponse, TNotification>
{
	private connection: RoomHostConnectionForApiProvider<
		TRequest,
		TResponse,
		TNotification
	>;

	readonly $request: CallbackSet<[TRequest], null | Promise<TResponse>>;

	constructor(
		connection: RoomHostConnectionForApiProvider<
			TRequest,
			TResponse,
			TNotification
		>,
	) {
		this.connection = connection;

		this.$request = new CallbackSet<
			[TRequest],
			null | Promise<TResponse>
		>();

		this.connection.messages$.subscribe(({ sender, data }) => {
			if (data.type === 'request') {
				this.handleRequest({ sender, data: data });
			}
		});
	}

	async handleRequest({
		sender,
		data: { id, data: request },
	}: {
		sender: string;
		data: {
			type: 'request';
			id: string;
			data: TRequest;
		};
	}) {
		try {
			const response = await Promise.all(
				this.$request.handle(request).filter((x) => x !== null),
			);

			if (response.length === 0) {
				console.warn(`No response for request ${id}, sending null.`);
				this.connection.sendTo(sender, {
					type: 'response-error',
					id,
					error: 'Unrecognized request',
				});
				return;
			}

			if (response.length > 1) {
				console.warn(
					`Multiple responses for request ${id}, using the first one.`,
				);
			}

			this.connection.sendTo(sender, {
				type: 'response',
				id,
				data: response.pop()!,
			});
		} catch (error) {
			this.connection.sendTo(sender, {
				type: 'response-error',
				id,
				error: error instanceof Error ? error.message : String(error),
			});
		}
	}

	notify(notification: TNotification): Promise<void> {
		this.connection.broadcast({
			type: 'notification',
			data: notification,
		});

		return Promise.resolve();
	}
}
