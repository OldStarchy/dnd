export default class CancellablePromise<T> implements PromiseLike<T> {
	private promise: Promise<T>;
	private controller: AbortController;

	constructor(
		callback: (
			resolve: (value: T) => void,
			reject: (reason?: unknown) => void,
			signal: AbortSignal,
		) => void,
	) {
		this.controller = new AbortController();

		this.promise = new Promise((resolve, reject) => {
			callback(resolve, reject, this.controller.signal);
		});
	}

	cancel() {
		this.controller.abort();
	}

	signal(signal: AbortSignal) {
		signal.addEventListener('abort', () => {
			this.cancel();
		});
		return this;
	}

	then<TResult1, TResult2>(
		resolved?:
			| ((
					value: T,
					signal: AbortSignal,
			  ) => TResult1 | PromiseLike<TResult1>)
			| undefined
			| null,
		rejected?:
			| ((
					reason: unknown,
					signal: AbortSignal,
			  ) => TResult2 | PromiseLike<TResult2>)
			| undefined
			| null,
	): CancellablePromise<TResult1 | TResult2> {
		const result = new CancellablePromise<TResult1 | TResult2>(
			(resolve, reject, signal) => {
				this.promise.then(
					(data) => {
						resolve(
							(resolved
								? resolved(data, signal)
								: data) as TResult1,
						);
					},
					rejected
						? (reason) => {
								resolve(rejected(reason, signal) as TResult2);
							}
						: reject,
				);
			},
		);

		result.signal(this.controller.signal);

		return result;
	}
}
