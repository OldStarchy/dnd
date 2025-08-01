import type { Deferred } from '@/deferred';
import deferred from '@/deferred';
import { Subject } from 'rxjs';
import z from 'zod';
import type { Transport } from './Transport';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ZodSchema<T> = z.ZodType<any, any, T> | z.ZodEffects<any, T, any>;

export type Unsubscriber = {
	(): void;
	withAbort(abort: AbortController | AbortSignal): void;
};
export class CallbackSet<TThis, TArgs extends unknown[], TReturn> {
	private handlers = new Set<(this: TThis, ...args: TArgs) => TReturn>();
	on(handler: (this: TThis, ...args: TArgs) => TReturn): Unsubscriber {
		this.handlers.add(handler);
		const unsub = (() => {
			this.handlers.delete(handler);
		}) as Unsubscriber;

		unsub.withAbort = (abort: AbortController | AbortSignal) => {
			if (abort instanceof AbortController) {
				abort.signal.addEventListener('abort', unsub);
			} else {
				abort.addEventListener('abort', unsub);
			}
			return unsub;
		};

		return unsub;
	}

	handle(sender: TThis, ...args: TArgs): TReturn[] {
		const results: TReturn[] = [];
		for (const handler of this.handlers) {
			try {
				results.push(handler.call(sender, ...args));
			} catch (error) {
				console.error('Error in callback handler:', error);
			}
		}
		return results;
	}
}

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

	readonly _notification$ = new Subject<TNotificationReceive>();
	readonly notification$ = this._notification$.asObservable();

	readonly _close$ = new Subject<void>();
	readonly close$ = this._close$.asObservable();

	readonly $request = new CallbackSet<
		this,
		[TRemoteRequest],
		null | Promise<TLocalResponse>
	>();

	constructor(
		remoteRequestSchema: ZodSchema<TRemoteRequest>,
		remoteResponseSchema: ZodSchema<TRemoteResponse>,
		remoteNotificationSchema: ZodSchema<TNotificationReceive>,
		transport: Transport<string>,
	) {
		const incomingMessageSpec = z.union([
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
			z.object({
				type: z.literal('notification'),
				data: remoteNotificationSchema,
			}),
		]);
		this.transport = transport;

		transport.message$.subscribe({
			next: (data: string) => {
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

						this._notification$.next(notification);
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
								const response = await Promise.all(
									this.$request
										.handle(this, request as TRemoteRequest)
										.filter((x) => x !== null),
								);

								if (response.length === 0) {
									console.warn(
										`No response for request ${id}, sending null.`,
									);
									this.send({
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

								this.send({
									type: 'response',
									id,
									data: response.pop()!,
								});
							} catch (error) {
								this.send({
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
						const def = this.requestCallbacks.get(id);
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
						const def = this.requestCallbacks.get(id);
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
			complete: (): void => {
				this.requestCallbacks.forEach((def) =>
					def.reject(new Error('Transport closed')),
				);
				this.requestCallbacks.clear();
				this._close$.next();
			},
			error: (error: unknown): void => {
				console.error('Transport error:', error);
				this.requestCallbacks.forEach((def) =>
					def.reject(new Error('Transport error')),
				);
				this.requestCallbacks.clear();
				this._close$.next();
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
