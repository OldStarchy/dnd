import type { AsyncOption } from './AsyncOption';
import optionResultInteropMissing from './optionResultInteropMissing';
import { Err, Ok, Result, UnknownError } from './Result';

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

	mapErr<F>(fn: (error: E) => F | PromiseLike<F>): AsyncResult<T, F> {
		return new AsyncResult(
			this.then(async (v) => {
				if (v.isOk()) {
					return v as Result<T, unknown> as Result<T, F>;
				}
				return Err(await fn(v.unwrapErr()));
			}),
		);
	}

	andThen<U, F>(
		fn: (value: T) => PromiseLike<Result<U, F>> | Result<U, F>,
	): AsyncResult<U, E | F> {
		return new AsyncResult(
			this.then(async (v) => {
				if (v.isOk()) {
					return await fn(v.unwrap());
				}
				return v as Result<unknown, E> as Result<U, E | F>;
			}),
		);
	}

	andTry<U>(
		fn: (value: T) => PromiseLike<U>,
	): AsyncResult<U, E | UnknownError> {
		return this.andThen((v) => AsyncResult.try(() => fn(v)));
	}

	orElse<U, F>(
		fn: (error: E) => PromiseLike<Result<U, F>> | Result<U, F>,
	): AsyncResult<T | U, F> {
		return new AsyncResult(
			this.then(async (v) => {
				if (v.isErr()) {
					return await fn(v.unwrapErr());
				}
				return v as Result<T, unknown> as Result<T | U, F>;
			}),
		);
	}

	orTry(fn: (error: E) => PromiseLike<T>): AsyncResult<T, E | UnknownError> {
		return this.orElse((e) => AsyncResult.try(() => fn(e)));
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

	unwrapOrElse<U = T>(
		fn: (err: E) => PromiseLike<U> | U,
	): PromiseLike<T | U> {
		return this.then((v) => v.unwrapOrElse(fn));
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
	static try<T>(fn: () => PromiseLike<T>): AsyncResult<T, UnknownError> {
		return AsyncResult.of(fn());
	}

	/**
	 * Usage of this is discouraged in favor of the strongly typed {@link wrap}.
	 */
	static of<T>(value: PromiseLike<T>): AsyncResult<T, UnknownError> {
		return new AsyncResult(value.then(Ok, (e) => Err(new UnknownError(e))));
	}

	static wrap<T, E>(fn: () => PromiseLike<Result<T, E>>): AsyncResult<T, E> {
		return new AsyncResult(fn());
	}

	static wrapFn<
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		Fn extends (this: void, ...args: any[]) => PromiseLike<any>,
		E,
	>(
		fn: Fn,
		mapError: (e: unknown) => E,
	): (...args: Parameters<Fn>) => AsyncResult<Awaited<ReturnType<Fn>>, E> {
		return (...args: Parameters<Fn>) =>
			AsyncResult.wrap<Awaited<ReturnType<Fn>>, E>(async () => {
				try {
					return Ok(await fn(...args));
				} catch (e: unknown) {
					return Err(mapError(e));
				}
			});
	}
}
