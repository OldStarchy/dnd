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
		const wrapper = function (this: This, ...args: TArgs): TReturn {
			Logger.write(level, `Calling ${this.constructor.name}.${name}:`, {
				args: args.filter((_, index) => !ignore.includes(index)),
				...(traceContext ? { context: traceContext } : {}),
			});
			const result = target.apply(this, args);
			Logger.write(level, `Result of ${name}:`, result);
			return result;
		};

		return wrapper;
	};
}
