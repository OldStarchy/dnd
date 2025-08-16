import { BehaviorSubject } from 'rxjs';

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
