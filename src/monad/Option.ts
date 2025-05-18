export default class Option<T> {
	readonly type: 'Some' | 'None';
	readonly value?: T;

	private constructor(type: 'Some', value: T);
	private constructor(type: 'None');
	private constructor(type: 'Some' | 'None', value?: T) {
		this.type = type;
		this.value = value;
	}

	static Some<T>(value: T): Option<T> {
		return new Option('Some', value);
	}

	private static readonly none: Option<unknown> = new Option('None');
	static None<T>(): Option<T> {
		return Option.none as Option<T>;
	}

	static {
		Object.defineProperty(this.Some, Symbol.hasInstance, {
			value: function (instance: unknown) {
				return instance instanceof Option && instance.type === 'Some';
			},
		});
		Object.defineProperty(this.None, Symbol.hasInstance, {
			value: function (instance: unknown) {
				return instance instanceof Option && instance.type === 'None';
			},
		});
	}

	isSome(): boolean {
		return this.type === 'Some';
	}

	isNone(): boolean {
		return this.type === 'None';
	}

	map<U>(fn: (value: T) => U): Option<U> {
		switch (this.type) {
			case 'Some':
				return Option.Some(fn(this.value!));
			case 'None':
				return this as unknown as Option<U>;
		}
	}

	mapOr<U>(defaultValue: U, fn: (value: T) => U): U {
		switch (this.type) {
			case 'Some':
				return fn(this.value!);
			case 'None':
				return defaultValue;
		}
	}

	expect(message: string): T | never {
		switch (this.type) {
			case 'Some':
				return this.value!;
			case 'None':
				throw new Error(message);
		}
	}

	unwrap(): T | never {
		switch (this.type) {
			case 'Some':
				return this.value!;
			case 'None':
				throw new Error('Called unwrap on None');
		}
	}
}

export const [Some, None] = [Option.Some, Option.None] as const;
