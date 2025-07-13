import type { Deferred } from '@/deferred';
import deferred from '@/deferred';
import z from 'zod';
import type { Transport, TransportFactory } from './Transport';

export interface RemoteApiHandler<
	TRemoteApi,
	TRemoteRequest,
	TLocalResult,
	TRemoteNotification,
> {
	handleNotification(
		this: TRemoteApi,
		notification: TRemoteNotification,
	): void;
	handleRequest(
		this: TRemoteApi,
		request: TRemoteRequest,
	): Promise<TLocalResult>;
	handleClose(this: TRemoteApi): void;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZodSchema<T> = z.ZodType<any, any, T> | z.ZodEffects<any, T, any>;

export class RemoteApi<
	TLocalRequest,
	TRemoteResponse,
	TRemoteRequest,
	TLocalResponse,
	TNotificationSend,
	TNotificationReceive,
> {
	private transport: Transport<string>;
	private requestCallbacks: Map<string, Deferred<TRemoteResponse>> =
		new Map();

	private notificationSubscribers: Set<
		(notification: TNotificationReceive) => void
	> = new Set();
	private closeSubscribers: Set<() => void> = new Set();

	onNotification(
		callback: (notification: TNotificationReceive) => void,
	): () => void {
		this.notificationSubscribers.add(callback);
		return () => {
			this.notificationSubscribers.delete(callback);
		};
	}

	onClose(callback: () => void): () => void {
		this.closeSubscribers.add(callback);
		return () => {
			this.closeSubscribers.delete(callback);
		};
	}

	constructor(
		remoteRequestSchema: ZodSchema<TRemoteRequest>,
		remoteResponseSchema: ZodSchema<TRemoteResponse>,
		remoteNotificationSchema: ZodSchema<TNotificationReceive>,
		transportFactory: TransportFactory<string>,
		handler: RemoteApiHandler<
			RemoteApi<
				TLocalRequest,
				TRemoteResponse,
				TRemoteRequest,
				TLocalResponse,
				TNotificationSend,
				TNotificationReceive
			>,
			TRemoteRequest,
			TLocalResponse,
			TNotificationReceive
		>,
	) {
		const incomingMessageSpec = z.union([
			z.object({
				type: z.literal('notification'),
				data: remoteNotificationSchema,
			}),
			z.object({
				type: z.literal('request'),
				id: z.string(),
				data: remoteRequestSchema,
			}),
			z.object({
				type: z.literal('response'),
				id: z.string(),
				data: remoteResponseSchema,
			}),
			z.object({
				type: z.literal('response-error'),
				id: z.string(),
				error: z.string(),
			}),
		]);
		// eslint-disable-next-line @typescript-eslint/no-this-alias
		const self = this;
		this.transport = transportFactory({
			handleMessage(data: string): void {
				let parsedJson: unknown;
				try {
					parsedJson = JSON.parse(data);
				} catch (error) {
					console.error(
						'Failed to parse message as JSON:',
						data,
						error,
					);
					return;
				}
				const parsedData = incomingMessageSpec.safeParse(parsedJson);

				if (!parsedData.success) {
					console.error(
						'Invalid message data received:',
						parsedJson,
						parsedData.error,
					);
					return;
				}

				const message = parsedData.data;

				switch (message.type) {
					case 'notification': {
						const { data: notification } = message as {
							data: TNotificationReceive;
						};
						try {
							handler.handleNotification.call(self, notification);
						} catch (error) {
							console.error(
								'Error handling notification:',
								notification,
								error,
							);
						}

						self.notificationSubscribers.forEach((subscriber) => {
							try {
								subscriber(notification);
							} catch (subscriberError) {
								console.error(
									'Error in notification subscriber:',
									subscriberError,
								);
							}
						});
						return;
					}
					case 'request': {
						const { id, data: request } = message as {
							type: 'request';
							id: string;
							data: TRemoteRequest;
						};
						(async () => {
							try {
								const response =
									await handler.handleRequest.call(
										self,
										request as TRemoteRequest,
									);

								self.send({
									type: 'response',
									id,
									data: response,
								});
							} catch (error) {
								self.send({
									type: 'response-error',
									id,
									error:
										error instanceof Error
											? error.message
											: String(error),
								});
							}
						})();
						return;
					}
					case 'response': {
						const { id, data: response } = message as {
							type: 'response';
							id: string;
							data: TRemoteResponse;
						};
						const def = self.requestCallbacks.get(id);
						if (def) {
							def.resolve(response);
						} else {
							console.error(
								`No pending response found for id: ${id}`,
							);
						}
						return;
					}
					case 'response-error': {
						const { id, error } = message as {
							type: 'response-error';
							id: string;
							error: string;
						};
						const def = self.requestCallbacks.get(id);
						if (def) {
							def.reject(new Error(error));
						} else {
							console.error(
								`No pending response found for id: ${id}`,
							);
						}
						return;
					}
					default: {
						// @ts-expect-error unused
						const _exhaustiveCheck: never = message;
					}
				}
			},
			handleClose(): void {
				self.requestCallbacks.forEach((def) =>
					def.reject(new Error('Transport closed')),
				);
				self.requestCallbacks.clear();
				try {
					handler.handleClose.call(self);
				} catch (error) {
					console.error('Error handling close:', error);
				}
				self.closeSubscribers.forEach((subscriber) => {
					try {
						subscriber();
					} catch (subscriberError) {
						console.error(
							'Error in close subscriber:',
							subscriberError,
						);
					}
				});
			},
			handleOpen(): void {
				self.flushSendQueue();
			},
		});
	}

	[Symbol.dispose](): void {
		this.transport.close();
	}

	private sendQueue: [message: string, resolver: Deferred<void>][] = [];
	private send(
		message:
			| { type: 'notification'; data: TNotificationSend }
			| { type: 'request'; id: string; data: TLocalRequest }
			| { type: 'response'; id: string; data: TLocalResponse }
			| { type: 'response-error'; id: string; error: string },
	): Promise<void> {
		const def = deferred<void>();
		this.sendQueue.push([JSON.stringify(message), def]);

		if (this.transport.isOpen()) {
			this.flushSendQueue();
		}

		return def.promise;
	}

	private flushSendQueue(): void {
		if (!this.transport.isOpen()) {
			return;
		}
		while (this.sendQueue.length > 0) {
			const [message, resolver] = this.sendQueue.shift()!;
			this.transport
				.send(message)
				.then(resolver.resolve, resolver.reject);
		}
	}

	notify(notification: TNotificationSend): Promise<void> {
		return this.send({ type: 'notification', data: notification });
	}

	request(request: TLocalRequest): Promise<TRemoteResponse> {
		const id = crypto.randomUUID();

		const def = deferred<TRemoteResponse>();
		this.requestCallbacks.set(id, def);

		this.send({ type: 'request', id, data: request }).catch((error) => {
			def.reject(error);
		});

		return def.promise.finally(() => {
			this.requestCallbacks.delete(id);
		});
	}
}
