import type { DndDb } from '@/sync/room/RoomApi';

import type { DocumentApi } from './Collection';
import { LocalCollection } from './LocalCollection';
import type { AnyRecordType, RecordTypeDefinition } from './RecordType';

export class RamCollection<
	RecordType extends AnyRecordType,
	Document extends DocumentApi<RecordType> = DocumentApi<RecordType>,
> extends LocalCollection<RecordType, Document> {
	private storage: RecordType['record'][];
	constructor(
		definition: RecordTypeDefinition<
			RecordType['record'],
			RecordType['filter'],
			Document
		>,
		db: DndDb,
	) {
		super(definition, db);
		this.storage = [];
	}

	protected override getRaw(): RecordType['record'][] {
		return this.storage;
	}

	protected override setRaw(items: RecordType['record'][]): void {
		this.storage = items;
	}
}
