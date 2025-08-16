import type { DocumentApi, ReadonlyDocumentApi } from './Collection';
import type { AnyRecordType } from './RecordType';

export class ReadonlyQueryResults<
	RecordType extends AnyRecordType,
> extends Array<ReadonlyDocumentApi<RecordType>> {
	constructor(items: ReadonlyDocumentApi<RecordType>[]) {
		super(...items);
	}

	toRaw(): RecordType['record'][] {
		return this.map((item) => item.data.getValue());
	}
}

export class QueryResults<RecordType extends AnyRecordType> extends Array<
	DocumentApi<RecordType>
> {
	constructor(...items: DocumentApi<RecordType>[]);
	constructor(size: number);
	constructor(...args: [...DocumentApi<RecordType>[]] | [size: number]) {
		if (typeof args[0] === 'number') {
			super(args[0]);
		} else {
			super(...(args as DocumentApi<RecordType>[]));
		}
	}

	toRaw(): RecordType['record'][] {
		return Array.from(this).map((item) => item.data.getValue());
	}
}
