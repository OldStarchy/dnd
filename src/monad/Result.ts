export default class Result<T, E> {
	readonly type: 'Ok' | 'Err';
	readonly value?: T;
	readonly error?: E;

	private constructor(type: 'Ok', value: T);
	private constructor(type: 'Err', error: E);
	private constructor(type: 'Ok' | 'Err', valueOrError: T | E) {
		this.type = type;
		if (type === 'Ok') {
			this.value = valueOrError as T;
		} else {
			this.error = valueOrError as E;
		}
	}

	static Ok<T, E>(value: T): Result<T, E> {
		return new Result('Ok', value);
	}

	static Err<T, E>(error: E): Result<T, E> {
		return new Result('Err', error);
	}

	static {
		Object.defineProperty(this.Ok, Symbol.hasInstance, {
			value: function (instance: unknown) {
				return instance instanceof Result && instance.type === 'Ok';
			},
		});
		Object.defineProperty(this.Err, Symbol.hasInstance, {
			value: function (instance: unknown) {
				return instance instanceof Result && instance.type === 'Err';
			},
		});
	}

	map<U>(fn: (value: T) => U): Result<U, E> {
		switch (this.type) {
			case 'Ok':
				return Result.Ok(fn(this.value!));
			case 'Err':
				return this as unknown as Result<U, E>;
		}
	}

	mapError<F>(fn: (error: E) => F): Result<T, F> {
		switch (this.type) {
			case 'Ok':
				return this as unknown as Result<T, F>;
			case 'Err':
				return Result.Err(fn(this.error!));
		}
	}

	isOk(): boolean {
		return this.type === 'Ok';
	}
	isError(): boolean {
		return this.type === 'Err';
	}

	expect(message: string): T | never {
		if (this.type === 'Ok') {
			return this.value!;
		}
		throw new Error(`${message}: ${this.error}`);
	}
	expectError(message: string): E | never {
		if (this.type === 'Err') {
			return this.error!;
		}
		throw new Error(`${message}: Expected an error, but got a value.`);
	}

	unwrap(): T {
		if (this.type === 'Ok') {
			return this.value!;
		}
		throw new Error('Expected an error, but got a value.');
	}
	unwrapError(): E {
		if (this.type === 'Err') {
			return this.error!;
		}
		throw new Error('Expected an error, but got a value.');
	}
}

export const [Ok, Err] = [Result.Ok, Result.Err] as const;
