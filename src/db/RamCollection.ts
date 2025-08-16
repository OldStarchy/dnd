import type { ZodType as ZodSchema } from 'zod';
import { LocalCollection } from './LocalCollection';
import type { AnyRecordType, RecordFilter } from './RecordType';

export class RamCollection<
	in out RecordType extends AnyRecordType,
> extends LocalCollection<RecordType> {
	private storage: RecordType['record'][];
	constructor(
		name: string,
		filterFn: RecordFilter<RecordType>,
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
