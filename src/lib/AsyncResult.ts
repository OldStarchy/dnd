import type { AsyncOption } from './AsyncOption';
import optionResultInteropMissing from './optionResultInteropMissing';
import { Err, Ok, Result } from './Result';

export class AsyncResult<T, E> implements PromiseLike<Result<T, E>> {
	declare ok: <T>(this: AsyncResult<T, unknown>) => AsyncOption<T>;

	static {
		this.prototype.ok = optionResultInteropMissing;
	}

	constructor(private readonly value: PromiseLike<Result<T, E>>) {}

	map<U>(fn: (value: T) => U | PromiseLike<U>): AsyncResult<U, E> {
		return new AsyncResult(
			this.then(async (v) => {
				if (v.isErr()) {
					return v as Result<unknown, E> as Result<U, E>;
				}
				return Ok(await fn(v.unwrap()));
			}),
		);
	}

	mapErr<U>(fn: (error: E) => U | PromiseLike<U>): AsyncResult<T, U> {
		return new AsyncResult(
			this.then(async (v) => {
				if (v.isOk()) {
					return v as Result<T, unknown> as Result<T, U>;
				}
				return Err(await fn(v.unwrapErr()));
			}),
		);
	}

	andThen<U, E2>(
		fn: (value: T) => PromiseLike<Result<U, E2>> | Result<U, E2>,
	): AsyncResult<U, E | E2> {
		return new AsyncResult(
			this.then(async (v) => {
				if (v.isOk()) {
					return await fn(v.unwrap());
				}
				return v as Result<unknown, E> as Result<U, E | E2>;
			}),
		);
	}

	andTry<U, E2 = unknown>(
		fn: (value: T) => PromiseLike<U>,
	): AsyncResult<U, E | E2> {
		return this.andThen((v) => AsyncResult.try<U, E2>(() => fn(v)));
	}

	inspect(fn: (value: T) => Promise<void> | void): AsyncResult<T, E> {
		return new AsyncResult(
			this.then(async (v) => {
				if (v.isOk()) {
					await fn(v.unwrap());
				}
				return v;
			}),
		);
	}

	inspectErr(fn: (value: E) => Promise<void> | void): AsyncResult<T, E> {
		return new AsyncResult(
			this.then(async (v) => {
				if (v.isErr()) {
					await fn(v.unwrapErr());
				}
				return v;
			}),
		);
	}

	unwrapOrNull(): PromiseLike<T | null> {
		return this.then((v) => v.unwrapOrNull());
	}

	unwrapOrElse(fn: () => PromiseLike<T> | T): PromiseLike<T> {
		return this.then((v) => (v.isOk() ? v.unwrap() : fn()));
	}

	unwrap(message?: string): PromiseLike<T> {
		return this.then((v) => v.unwrap(message));
	}

	throw(): PromiseLike<T> {
		return this.then((v) => v.throw());
	}

	then<TResult1, TResult2>(
		resolved?:
			| ((value: Result<T, E>) => TResult1 | PromiseLike<TResult1>)
			| undefined
			| null,
		rejected?:
			| ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
			| undefined
			| null,
	): PromiseLike<TResult1 | TResult2> {
		return this.value.then(resolved, rejected);
	}

	/**
	 * Usage of this is discouraged in favor of the strongly typed {@link wrap}.
	 */
	static try<T, E>(fn: () => PromiseLike<T>): AsyncResult<T, E> {
		return AsyncResult.of(fn());
	}

	/**
	 * Usage of this is discouraged in favor of the strongly typed {@link wrap}.
	 */
	static of<T, E>(value: PromiseLike<T>): AsyncResult<T, E> {
		return new AsyncResult(value.then(Ok, Err));
	}

	static wrap<T, E>(fn: () => PromiseLike<Result<T, E>>): AsyncResult<T, E> {
		return new AsyncResult(fn());
	}

	static wrapFn<
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Fn extends (this: void, ...args: any[]) => PromiseLike<any>,
	>(
		fn: Fn,
	): <E>(...args: Parameters<Fn>) => AsyncResult<Awaited<ReturnType<Fn>>, E> {
		return <E>(...args: Parameters<Fn>) =>
			AsyncResult.try<Awaited<ReturnType<Fn>>, E>(() => fn(...args));
	}
}
