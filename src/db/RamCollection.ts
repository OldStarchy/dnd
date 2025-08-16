import type { ZodType as ZodSchema } from 'zod';
import { LocalCollection } from './LocalCollection';
import type { AnyRecordType } from './RecordType';

export class RamCollection<
	in out RecordType extends AnyRecordType,
> extends LocalCollection<RecordType> {
	private storage: RecordType['record'][];
	constructor(
		name: string,
		filterFn: (
			item: RecordType['record'],
			filter?: RecordType['filter'],
		) => boolean,
		schema: ZodSchema<RecordType['record']>,
	) {
		super(name, filterFn, schema);
		this.storage = [];
	}

	protected override getRaw(): RecordType['record'][] {
		return this.storage;
	}

	protected override setRaw(items: RecordType['record'][]): void {
		this.storage = items;
	}
}
