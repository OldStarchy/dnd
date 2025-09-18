import type z from 'zod';
import type { AsyncResult } from './AsyncResult';
import type { Option } from './Option';
import optionResultInteropMissing from './optionResultInteropMissing';

const OK = Symbol('Result.OK');
const ERR = Symbol('Result.ERR');
type OK = typeof OK;
type ERR = typeof ERR;

export class Result<T, E> {
	declare ok: <T>(this: Result<T, unknown>) => Option<T>;

	static {
		this.prototype.ok = optionResultInteropMissing;
	}

	readonly #type: OK | ERR;
	readonly #value?: T;
	readonly #error?: E;

	private constructor(
		type: OK | ERR,
		value: T | undefined,
		error: E | undefined,
	) {
		this.#type = type;
		this.#value = value;
		this.#error = error;
	}

	isOk(): this is Result<T, never> {
		return this.#type === OK;
	}

	isErr(): this is Result<never, E> {
		return this.#type === ERR;
	}

	map<U>(fn: (value: T) => U): Result<U, E> {
		switch (this.#type) {
			case OK:
				return new Result<U, E>(OK, fn(this.#value as T), undefined);
			case ERR:
				return new Result<U, E>(ERR, undefined, this.#error);
		}
	}

	and<U>(res: Result<U, E>): Result<U, E> {
		if (this.#type === OK) {
			return res;
		}
		return this as Result<unknown, E> as Result<U, E>;
	}

	andThen<U, E2>(fn: (value: T) => Result<U, E2>): Result<U, E | E2> {
		if (this.#type === OK) {
			return fn(this.#value!);
		}
		return this as Result<unknown, E> as Result<U, E | E2>;
	}

	inspect(fn: (value: T) => void): this {
		if (this.#type === OK) {
			fn(this.#value as T);
		}
		return this;
	}

	inspectErr(fn: (error: E) => void): this {
		if (this.#type === ERR) {
			fn(this.#error!);
		}
		return this;
	}

	unwrapOrNull(): T | null {
		if (this.#type === OK) {
			return this.#value!;
		}
		return null;
	}

	unwrapOrElse(_fn: (err: E) => T): T {
		if (this.#type === OK) {
			return this.#value!;
		}
		return _fn(this.#error!);
	}

	unwrapOr(defaultValue: T): T {
		if (this.#type === OK) {
			return this.#value!;
		}
		return defaultValue;
	}

	unwrap(message?: string): T {
		if (this.#type === OK) {
			return this.#value!;
		}

		const err = new Error(
			message ?? `Tried to unwrap an Err value: ${this.#error}`,
			{ cause: this.#error! },
		);

		Error.captureStackTrace(err, this.unwrap);
		throw err;
	}

	throw(): T {
		if (this.#type === ERR) {
			throw this;
		}

		return this.#value!;
	}

	unwrapErr(message?: string): E {
		if (this.#type === ERR) {
			return this.#error!;
		}

		const err = new Error(
			message ?? `Tried to unwrapErr an Ok value: ${this.#value}`,
			{ cause: this.#value! },
		);

		Error.captureStackTrace(err, this.unwrapErr);
		throw err;
	}

	[Symbol.toStringTag](): string {
		if (this.#type === OK) {
			return `Ok(${this.#value})`;
		} else {
			return `Err(${this.#error})`;
		}
	}

	static Ok<T, E = never>(value: T): Result<T, E> {
		return new Result<T, E>(OK, value, undefined);
	}

	static Err<T = never, E = unknown>(error: E): Result<T, E> {
		return new Result<T, E>(ERR, undefined, error);
	}

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	static wrap<Fn extends (this: void, ...args: any[]) => any>(
		fn: Fn,
	): <E>(...args: Parameters<Fn>) => Result<ReturnType<Fn>, E> {
		return <E>(...args: Parameters<Fn>) =>
			Result.try<ReturnType<Fn>, E>(() => fn(...args));
	}

	static try<T, E = unknown>(fn: () => T): Result<T, E> {
		try {
			return Result.Ok<T, E>(fn());
		} catch (err) {
			return Result.Err<T, E>(err as E);
		}
	}

	static zodParse<Schema extends z.ZodType>(
		schema: Schema,
		data: unknown,
	): Result<z.output<Schema>, z.ZodError<z.output<Schema>>> {
		const result = schema.safeParse(data);

		if (result.success) {
			return Result.Ok(result.data);
		} else {
			return Result.Err(result.error);
		}
	}

	static responseOk(response: Response): Result<Response, number> {
		if (response.ok) {
			return Result.Ok(response);
		} else {
			return Result.Err(response.status);
		}
	}
}

export function Ok<T, E = never>(value: T): Result<T, E> {
	return Result.Ok<T, E>(value);
}

export function Err<T = never, E = unknown>(err: E): Result<T, E> {
	return Result.Err<T, E>(err);
}

export namespace Result {
	export type InferOk<R> =
		R extends Result<infer T, unknown>
			? T
			: R extends AsyncResult<infer T, unknown>
				? T
				: R extends PromiseLike<infer R>
					? InferOk<R>
					: // eslint-disable-next-line @typescript-eslint/no-explicit-any
						R extends (...args: any[]) => infer R
						? InferOk<R>
						: never;
	export type InferErr<R> =
		R extends Result<unknown, infer E>
			? E
			: R extends AsyncResult<unknown, infer E>
				? E
				: R extends PromiseLike<infer R>
					? InferErr<R>
					: // eslint-disable-next-line @typescript-eslint/no-explicit-any
						R extends (...args: any[]) => infer R
						? InferErr<R>
						: never;
}
