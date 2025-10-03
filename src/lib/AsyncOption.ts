import type { AsyncResult } from './AsyncResult';
import { None, Option, Some } from './Option';
import optionResultInteropMissing from './optionResultInteropMissing';

export class AsyncOption<T> implements PromiseLike<Option<T>> {
	declare okOr: <T, E>(this: AsyncOption<T>, err: E) => AsyncResult<T, E>;

	static {
		this.prototype.okOr = optionResultInteropMissing;
	}

	constructor(private readonly value: PromiseLike<Option<T>>) {}

	static of<T>(value: PromiseLike<T | null | undefined>): AsyncOption<T> {
		return new AsyncOption(value.then(Option.of));
	}

	static transpose<T>(value: Option<PromiseLike<T>>): AsyncOption<T> {
		return value
			.map(AsyncOption.Some<PromiseLike<T>>)
			.unwrapOrElse(AsyncOption.None<PromiseLike<T>>);
	}

	static Some<T>(value: T): AsyncOption<Awaited<T>> {
		return new AsyncOption(Promise.resolve(value).then(Some));
	}

	static None<T>(): AsyncOption<Awaited<T>> {
		return new AsyncOption(Promise.resolve(None()));
	}

	map<U>(fn: (value: T) => U): AsyncOption<U> {
		return new AsyncOption(this.then((v) => v.map(fn)));
	}

	inspect(fn: (value: T) => Promise<void> | void): AsyncOption<T> {
		return new AsyncOption(
			this.then(async (v) => {
				if (v.isSome()) {
					await fn(v.unwrap());
				}
				return v;
			}),
		);
	}

	unwrapOrNull(): PromiseLike<T | null> {
		return this.then((v) => v.unwrapOrNull());
	}

	unwrapOrElse(fn: () => PromiseLike<T> | T): PromiseLike<T> {
		return this.then((v) => (v.isSome() ? v.unwrap() : fn()));
	}

	unwrap(message?: string): PromiseLike<T> {
		return this.then((v) => v.unwrap(message));
	}

	then<TResult1, TResult2>(
		resolved?:
			| ((value: Option<T>) => TResult1 | PromiseLike<TResult1>)
			| undefined
			| null,
		rejected?:
			| ((reason: unknown) => TResult2 | PromiseLike<TResult2>)
			| undefined
			| null,
	): PromiseLike<TResult1 | TResult2> {
		return this.value.then(resolved, rejected);
	}
}
