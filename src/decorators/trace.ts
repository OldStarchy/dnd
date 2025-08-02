import Logger, { type Level } from '@/lib/log';

export default function trace<This, TArgs extends unknown[], TReturn>(
	level: Level,
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
			Logger.write(level, `Calling ${name} with arguments:`, args);
			const result = target.apply(this, args);
			Logger.write(level, `Result of ${name}:`, result);
			return result;
		};

		return wrapper;
	};
}
