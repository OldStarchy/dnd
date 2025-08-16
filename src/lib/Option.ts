namespace OptionImpl {
	interface OptionApi<T> {
		isSome(): this is Some<T>;
		isNone(): this is None;
		map<U>(fn: (value: T) => U): Option<U>;
		inspect(fn: (value: T) => void): this;
		unwrapOrNull(): T | null;
		unwrapOrElse(fn: () => T): T;
		unwrap(message?: string): T;
	}

	export class None implements OptionApi<never> {
		static instance = new None();

		private constructor() {}

		isSome<T>(): this is Some<T> {
			return false;
		}

		isNone(): this is None {
			return true;
		}

		map<U>(_fn: (value: never) => U): Option<U> {
			return this;
		}

		inspect(_fn: (value: never) => void): this {
			return this;
		}

		unwrapOrNull(): null {
			return null;
		}

		unwrapOrElse<T>(fn: () => T): T {
			return fn();
		}

		unwrap(message?: string): never {
			const err = new Error(message ?? 'Tried to unwrap a None value');

			Error.captureStackTrace(err, this.unwrap);

			throw err;
		}
	}

	export class Some<T> implements OptionApi<T> {
		#value: T;
		constructor(value: T) {
			this.#value = value;
		}

		isSome(): this is Some<T> {
			return true;
		}

		isNone(): this is None {
			return false;
		}

		map<U>(fn: (value: T) => U): Option<U> {
			return new Some(fn(this.#value));
		}

		inspect(fn: (value: T) => void): this {
			fn(this.#value);
			return this;
		}

		unwrapOrNull(): T {
			return this.#value;
		}

		unwrapOrElse(_fn: () => T): T {
			return this.#value;
		}

		unwrap(_message?: string): T {
			return this.#value;
		}
	}
}

export type Option<T> = OptionImpl.Some<T> | OptionImpl.None;

export namespace Option {
	export function of<T>(value: T | null | undefined): Option<T> {
		if (value === null || value === undefined) {
			return None();
		}
		return new OptionImpl.Some(value);
	}
}

export function Some<T>(value: T): Option<T> {
	return new OptionImpl.Some(value);
}

export function None<T>(): Option<T> {
	return OptionImpl.None.instance;
}
