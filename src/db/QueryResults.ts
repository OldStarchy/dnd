import type { DocumentApi } from './Collection';
import type { AnyRecordType } from './RecordType';

export class QueryResults<
	RecordType extends AnyRecordType,
	DocumentSpecies extends DocumentApi<RecordType> = DocumentApi<RecordType>,
> extends Array<DocumentSpecies> {
	constructor(...items: DocumentSpecies[]);
	constructor(size: number);
	constructor(...args: [...DocumentSpecies[]] | [size: number]) {
		if (typeof args[0] === 'number') {
			super(args[0]);
		} else {
			super(...(args as DocumentSpecies[]));
		}
	}

	toRaw(): RecordType['record'][] {
		return Array.from(this).map((item) => item.data);
	}
}
