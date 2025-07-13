export default function trace<This, TArgs extends unknown[], TReturn>(
	target: (this: This, ...args: TArgs) => TReturn,
	context: ClassMethodDecoratorContext<
		This,
		(this: This, ...args: TArgs) => TReturn
	>,
) {
	const name = context.name.toString();
	const wrapper = function (this: This, ...args: TArgs): TReturn {
		console.trace(`Calling ${name} with arguments:`, args);
		const result = target.apply(this, args);
		console.trace(`Result of ${name}:`, result);
		return result;
	};

	return wrapper;
}
