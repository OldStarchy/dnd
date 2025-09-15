import { BehaviorSubject } from 'rxjs';

/**
 * Transforms a private field value into a getter/setter pair backed by a BehaviorSubject.
 *
 * The BehaviorSubject is exposed as a property with the same name as the field, but with a `$` suffix.
 * This can be customized by providing a `name` argument.
 *
 * @example
 * ```ts
 * class Example {
 *   @ autoSubject()
 *   private count = 0;
 * }
 *
 * const example = new Example();
 * console.log(example.count); // 0
 * example.count$.subscribe(value => console.log(value)); // 0
 * example.count = 5; // Logs: 5
 * ```
 */
export default function autoSubject(name?: string | symbol) {
	return (_: undefined, context: ClassFieldDecoratorContext) => {
		const subjectPropertyName = (() => {
			if (name !== undefined) {
				return name;
			}

			if (typeof context.name === 'symbol') {
				throw new Error('Observable property cannot be a symbol');
			}

			return context.name + '$';
		})();

		context.addInitializer(function () {
			const subject = new BehaviorSubject(context.access.get(this));

			Object.defineProperty(this, subjectPropertyName, {
				get: () => subject,
			});

			Object.defineProperty(this, context.name, {
				get: () => subject.value,
				set: (value) => subject.next(value),
			});
		});
	};
}
