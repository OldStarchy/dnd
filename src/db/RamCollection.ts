import type { ZodType as ZodSchema } from 'zod';
import { LocalCollection } from './LocalCollection';

export class RamCollection<
	const TName extends string,
	T extends { id: string; revision: number },
	TFilter,
> extends LocalCollection<TName, T, TFilter> {
	private storage: T[];
	constructor(
		name: TName,
		filterFn: (item: T, filter?: TFilter) => boolean,
		schema: ZodSchema<T>,
	) {
		super(name, filterFn, schema);
		this.storage = [];
	}

	protected override getRaw(): T[] {
		return this.storage;
	}

	protected override setRaw(items: T[]): void {
		this.storage = items;
	}
}
