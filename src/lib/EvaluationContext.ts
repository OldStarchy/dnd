import { floor, parse, SymbolNode } from 'mathjs';

import type { CharacterVariablesTemplate } from '@/characterTemplates/CharacterVariablesTemplate';
import Result, { Err, Ok } from '@/monad/Result';
import Variable from './Variable';

export default class EvaluationContext {
	readonly variables = new Map<string, Variable>();

	addVariable(name: string, formula: string) {
		const expression = parse(formula);

		const derivedFrom = new Set<string>();

		expression.traverse((node) => {
			if (node instanceof SymbolNode) {
				const variableName = node.name;
				derivedFrom.add(variableName);
			}
		});
		const evaluate = expression.compile();

		const variable = new Variable(
			name,
			formula,
			derivedFrom,
			evaluate,
			this,
		);

		this.variables.set(name, variable);

		this.invalidate(name);
	}

	invalidate(name: string) {
		const variable = this.variables.get(name);

		if (!variable) {
			throw new Error(`Variable "${name}" does not exist.`);
		}

		variable.invalidate();

		for (const variable of this.variables.values()) {
			if (variable.derivedFrom.has(name)) {
				this.invalidate(variable.name);
			}
		}
	}

	validate(): Result<null, string[]> {
		const errors: string[] = [];
		const cache = new Map<
			Variable,
			Result<null, { chain: string[]; loop: string }>
		>();
		const variables = this.variables;

		function checkForLoopsImpl(
			variable: Variable,
			chain: string[],
		): Result<null, { chain: string[]; loop: string }> {
			const dependencyChain = [...chain, variable.name];

			for (const derivedVariableName of variable.derivedFrom) {
				if (chain.includes(derivedVariableName)) {
					return Err({
						chain: [...dependencyChain, derivedVariableName],
						loop: derivedVariableName,
					});
				}

				const derivedVariable = variables.get(derivedVariableName);

				if (EvaluationContext.functions[derivedVariableName]) {
					continue;
				}
				if (!derivedVariable) {
					continue;
				}

				const result = checkForLoops(derivedVariable, dependencyChain);

				if (result.isError()) {
					return result;
				}
			}

			return Ok(null);
		}

		function checkForLoops(
			variable: Variable,
			chain: string[] = [],
		): Result<null, { chain: string[]; loop: string }> {
			if (!cache.has(variable)) {
				const result = checkForLoopsImpl(variable, chain);
				cache.set(variable, result);
			}

			return cache.get(variable)!;
		}

		for (const variable of variables.values()) {
			const result = checkForLoops(variable);

			if (result.isError()) {
				errors.push(
					`Variable "${variable.name}" has a circular dependency: ${result.unwrapError().chain.join(' => ')}`,
				);
			}
		}

		if (errors.length > 0) {
			return Err(errors);
		}

		return Ok(null);
	}

	static functions = {
		d: (sides: number) => {
			const r = Math.floor(Math.random() * sides) + 1;
			console.log(`d${sides} = ${r}`);
			return r;
		},
		adv: (sides: number, adv: number = 2) => {
			const rolls = Array.from(
				{ length: adv },
				() => Math.floor(Math.random() * sides) + 1,
			);
			const maxRoll = Math.max(...rolls);
			console.log(
				`adv(${sides}, ${adv}) [${rolls.join(', ')}] = ${maxRoll}`,
			);
			return maxRoll;
		},
		floor: floor,
	} as Record<string, (...args: number[]) => number>;

	has(key: string): boolean {
		return this.variables.has(key) || key in EvaluationContext.functions;
	}

	get(key: string): number | ((...args: number[]) => number) | undefined {
		if (EvaluationContext.functions[key]) {
			return EvaluationContext.functions[key];
		}
		return this.variables.get(key)?.value;
	}

	set(key: string, value: number): this {
		const variable = this.variables.get(key);

		if (!variable) {
			throw new Error(`Variable "${key}" does not exist.`);
		}

		this.variables.delete(key);
		this.addVariable(key, value.toString());

		const validation = this.validate();
		if (validation.isError()) {
			this.variables.set(key, variable);
			throw new Error(
				`Setting variable "${key}" to ${value} would create an error.\n` +
					validation.unwrapError().join('\n'),
			);
		}

		return this;
	}

	keys(): MapIterator<string> {
		return this.variables.keys();
	}

	static fromTemplate(
		template: CharacterVariablesTemplate,
	): EvaluationContext {
		const context = new EvaluationContext();

		for (const [name, { formula }] of Object.entries(template)) {
			context.addVariable(name, formula);
		}

		const result = context.validate();

		if (result.isError()) {
			throw new Error(
				`Invalid template: \n${result.unwrapError().join('\n')}`,
			);
		}

		return context;
	}
}
