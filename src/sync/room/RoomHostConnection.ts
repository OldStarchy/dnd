import { traceAsync } from '@/decorators/trace';
import type { Deferred } from '@/deferred';
import deferred from '@/deferred';
import CancellablePromise from '@/lib/CancellablePromise';
import filterMap, { Skip } from '@/lib/filterMap';
import Logger from '@/lib/log';
import { BehaviorSubject, Observable, take } from 'rxjs';
import { InboundNotification, InboundRequest } from '../message/inbound';
import type { OutboundNotification } from '../message/outbound';
import {
	userMessageSchema,
	type UserMessage,
	type UserMessageOfType,
} from '../message/raw';
import {
	type InboundSystemMessage,
	type InboundSystemMessageOfType,
} from '../message/schema/InboundSystemMessage';
import { type OutboundSystemMessage } from '../message/schema/OutboundSystemMessage';
import type { ClosableTransport } from '../transports/Transport';
import type RoomHost from './RoomHost';
import Member from './member/Member';
import type { MemberId } from './types';

type MemberPresence = {
	id: MemberId;
	online: boolean;
};

export default class RoomHostConnection {
	readonly systemNotification$: Observable<InboundSystemMessage>;

	private readonly members: Map<MemberId, Member>;

	private userMessage$: Observable<{
		sender: MemberId;
		message: UserMessage;
	}>;
	readonly request$: Observable<InboundRequest>;
	readonly notification$: Observable<InboundNotification>;
	private presence$: Observable<
		InboundSystemMessageOfType<'room.members.presence'>
	>;

	get gm() {
		return this.members.get(this.gameMasterId)!;
	}

	getMember(id: MemberId) {
		return this.members.get(id);
	}

	getMembers(): Iterable<Member> {
		return this.members.values();
	}

	constructor(
		readonly id: MemberId,
		readonly gameMasterId: MemberId,
		currentMembers: MemberPresence[],
		readonly host: RoomHost,
		private connection: ClosableTransport<
			OutboundSystemMessage,
			InboundSystemMessage
		>,
	) {
		Logger.info(`Connected as ${id} to ${host.host}`);

		this.id = id;
		this.gameMasterId = gameMasterId;
		this.host = host;
		this.members = new Map();

		this.systemNotification$ = connection.message$;
		connection.state$.subscribe(() => this.trySend());

		this.userMessage$ = this.systemNotification$.pipe(
			filterMap((notification) => {
				if (notification.type !== 'member.message') return Skip;

				const { message, sender } = notification.data;

				const parsed = userMessageSchema.safeParse(message);
				if (!parsed.success) {
					return Skip;
				}

				return { sender, message: parsed.data };
			}),
		);

		this.request$ = this.userMessage$.pipe(
			filterMap(({ sender, message }) => {
				if (message.type !== 'request') return Skip;

				const { data, id } = message;

				const result = deferred<UserMessageOfType<'response'>>();

				result.promise.then(
					(response) => {
						this._send({
							to: sender,
							data: { id, type: 'response', data: response },
						});
					},
					(error) => {
						this._send({
							to: sender,
							data: {
								id,
								type: 'response-error',
								error: String(error),
							},
						});
					},
				);

				return new InboundRequest(sender, data, result);
			}),
		);

		this.notification$ = this.userMessage$.pipe(
			filterMap(({ sender, message }) => {
				if (message.type !== 'notification') return Skip;

				return new InboundNotification(sender, message.data);
			}),
		);

		this.presence$ = this.systemNotification$.pipe(
			filterMap((notification) =>
				notification.type === 'room.members.presence'
					? notification.data
					: Skip,
			),
		);

		for (const member of currentMembers) {
			this.members.set(
				member.id,
				this.createMember(member.id, member.online),
			);
		}

		this.systemNotification$.subscribe((notification) => {
			switch (notification.type) {
				case 'room.members.joined': {
					this.members.set(
						notification.data.id,
						this.createMember(notification.data.id, false),
					);
					return;
				}
				case 'room.members.left':
					this.members.delete(notification.data.id);
					return;
			}
		});
	}

	private createMember(id: MemberId, online: boolean) {
		const online$ = new BehaviorSubject(online);
		this.presence$
			.pipe(filterMap((presence) => (presence.id === id ? online : Skip)))
			.subscribe(online$);

		return new Member(this, id, online$);
	}

	#sendQueue: { deferred: Deferred<void>; message: OutboundSystemMessage }[] =
		[];
	private _send(message: OutboundSystemMessage): Promise<void> {
		const $deferred = deferred<void>();
		this.#sendQueue.push({ message, deferred: $deferred });

		this.trySend();

		return $deferred.promise;
	}

	@traceAsync(Logger.INFO)
	// @ts-expect-error friend function for `Member`
	private request(
		to: MemberId,
		message: UserMessageOfType<'request'>,
	): CancellablePromise<UserMessageOfType<'response'>> {
		return new CancellablePromise<UserMessageOfType<'response'>>(
			(resolve, reject, signal) => {
				const id: string = crypto.randomUUID();

				const subscription = this.userMessage$
					.pipe(
						filterMap(({ sender, message }) => {
							if (sender !== to) return Skip;
							if (
								message.type !== 'response' &&
								message.type !== 'response-error'
							)
								return Skip;
							if (message.id !== id) return Skip;

							if (message.type === 'response') {
								return message.data;
							} else {
								throw new Error(message.error);
							}
						}),
						take(1),
					)
					.subscribe({
						next: resolve,
						error: reject,
						complete: () => reject('Disconnected'),
					});

				signal.addEventListener('abort', () => {
					subscription.unsubscribe();
					reject(new Error('Aborted'));
				});

				this._send({
					to,
					data: {
						type: 'request',
						id,
						data: message,
					},
				}).catch(reject);
			},
		);
	}

	private trySend() {
		if (this.connection.state$.value !== 'open') {
			return;
		}

		while (this.#sendQueue.length > 0) {
			const { message, deferred } = this.#sendQueue.shift()!;

			this.connection.send(message).then(
				() => deferred.resolve(),
				(err) => deferred.reject(err),
			);
		}
	}

	broadcast(message: OutboundNotification) {
		this._send({
			data: message.toUserMessage(),
		});
	}

	close() {
		this.connection.close();
	}

	get state$() {
		return this.connection.state$;
	}
}
