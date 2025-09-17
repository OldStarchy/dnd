const OK = Symbol('Result.OK');
const ERR = Symbol('Result.ERR');
type OK = typeof OK;
type ERR = typeof ERR;

export class Result<T, E> {
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

	isOk(): boolean {
		return this.#type === OK;
	}

	isErr(): boolean {
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
}

export function Ok<T, E>(value: T): Result<T, E> {
	return Result.Ok<T, E>(value);
}

export function Err<T, E>(err: E): Result<T, E> {
	return Result.Err<T, E>(err);
}
