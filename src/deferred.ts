export default function deferred<T>(): {
	resolve: (value: T | PromiseLike<T>) => void;
	reject: (reason?: unknown) => void;
	promise: Promise<T>;
} {
	let resolve!: (value: T | PromiseLike<T>) => void;
	let reject!: (reason?: unknown) => void;

	const promise = new Promise<T>((res, rej) => {
		resolve = res;
		reject = rej;
	});

	return { resolve, reject, promise };
}

export type Deferred<T> = ReturnType<typeof deferred<T>>;
