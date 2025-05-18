import type { EvalFunction } from 'mathjs';

import type EvaluationContext from './EvaluationContext';

export default class Variable {
	readonly name: string;
	readonly formula: string;
	readonly derivedFrom: ReadonlySet<string>;
	readonly evaluate: EvalFunction;
	readonly context: EvaluationContext;

	private cached: null | number = null;

	constructor(
		name: string,
		formula: string,
		derivedFrom: ReadonlySet<string>,
		evaluate: EvalFunction,
		context: EvaluationContext,
	) {
		this.name = name;
		this.formula = formula;
		this.derivedFrom = derivedFrom;
		this.evaluate = evaluate;
		this.context = context;
	}

	private evaluating = false;
	get value(): number {
		if (this.cached === null) {
			if (this.evaluating) {
				throw new Error(
					`Circular dependency detected for variable "${this.name}".`,
				);
			}
			this.evaluating = true;

			const result = this.evaluate.evaluate(this.context);
			if (typeof result !== 'number') {
				throw new Error(
					`Variable "${this.name}" evaluated to a non-number value: ${result}`,
				);
			}
			this.cached = result;

			this.evaluating = false;
		}
		return this.cached!;
	}

	invalidate() {
		this.cached = null;
	}
}
