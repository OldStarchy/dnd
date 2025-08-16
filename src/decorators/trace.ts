import Logger, { type Level } from '@/lib/log';

export default function trace<
	This extends { constructor: { name: string } },
	TArgs extends unknown[],
	TReturn,
>(
	level: Level,
	{
		ignore = [],
		context: traceContext = null,
	}: {
		/**
		 * Indices of arguments to ignore in the log output.
		 * Useful for avoiding logging sensitive data or large objects.
		 */
		ignore?: number[];
		/**
		 * Optional context for the trace.
		 * This can be used to provide additional information about the trace.
		 */
		context?: Record<string, unknown> | null;
	} = {},
): (
	target: (this: This, ...args: TArgs) => TReturn,
	context: ClassMethodDecoratorContext<
		This,
		(this: This, ...args: TArgs) => TReturn
	>,
) => (this: This, ...args: TArgs) => TReturn {
	return (target, context) => {
		const name = context.name.toString();
		let callIndex = 0;
		const wrapper = function (this: This, ...args: TArgs): TReturn {
			const callId = `${this.constructor.name}.${name}(${callIndex++})`;
			Logger.write(level, `Calling ${callId}:`, {
				args: args.filter((_, index) => !ignore.includes(index)),
				...(traceContext ? { context: traceContext } : {}),
			});

			try {
				const result = target.apply(this, args);
				Logger.write(level, `Result of ${callId}:`, result);
				return result;
			} catch (error) {
				Logger.write(level, `Error in ${callId}:`, error);
				throw error;
			}
		};

		return wrapper;
	};
}

export function traceAsync<
	This extends { constructor: { name: string } },
	TArgs extends unknown[],
	TReturn extends PromiseLike<unknown>,
>(
	level: Level,
	{
		ignore = [],
		context: traceContext = null,
	}: {
		/**
		 * Indices of arguments to ignore in the log output.
		 * Useful for avoiding logging sensitive data or large objects.
		 */
		ignore?: number[];
		/**
		 * Optional context for the trace.
		 * This can be used to provide additional information about the trace.
		 */
		context?: Record<string, unknown> | null;
	} = {},
): (
	target: (this: This, ...args: TArgs) => TReturn,
	context: ClassMethodDecoratorContext<
		This,
		(this: This, ...args: TArgs) => TReturn
	>,
) => (this: This, ...args: TArgs) => TReturn {
	return (target, context) => {
		const name = context.name.toString();
		let callIndex = 0;
		const wrapper = function (this: This, ...args: TArgs): TReturn {
			const callId = `${this.constructor.name}.${name}(${callIndex++})`;
			Logger.write(level, `Calling ${callId}:`, {
				args: args.filter((_, index) => !ignore.includes(index)),
				...(traceContext ? { context: traceContext } : {}),
			});

			const result = target.apply(this, args);

			result.then(
				(result) => {
					Logger.write(level, `Result of ${callId}:`, result);
				},
				(error) => {
					Logger.write(level, `Error in ${callId}:`, error);
				},
			);

			return result;
		};

		return wrapper;
	};
}
