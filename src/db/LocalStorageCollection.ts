import type { DndDb } from '@/sync/room/RoomApi';

import type { DocumentApi } from './Collection';
import { LocalCollection } from './LocalCollection';
import type { AnyRecordType, RecordTypeDefinition } from './RecordType';

export class LocalStorageCollection<
	const RecordType extends AnyRecordType,
	const Document extends DocumentApi<RecordType> = DocumentApi<RecordType>,
> extends LocalCollection<RecordType, Document> {
	private readonly storageKey: string;

	constructor(
		definition: RecordTypeDefinition<
			RecordType['record'],
			RecordType['filter'],
			Document
		>,
		db: DndDb,
	) {
		super(definition, db);
		this.storageKey = `dnd.db.${this.name}`;
	}

	protected override getRaw(): RecordType['record'][] {
		const items = localStorage.getItem(this.storageKey);
		try {
			const parsed = items ? JSON.parse(items) : [];

			if (!Array.isArray(parsed)) {
				console.log(
					`Invalid data in localStorage for key "${this.storageKey}": Expected an array but got ${typeof parsed}`,
				);

				console.log(items);
				return [];
			}

			const validItems: RecordType['record'][] = [];
			for (const item of parsed) {
				const parsedItem = this.schema.safeParse(item);
				if (parsedItem.success) {
					validItems.push(parsedItem.data);
				} else {
					console.error(
						`Invalid item in localStorage for key "${this.storageKey}":`,
						parsedItem.error,
					);
				}
			}

			return validItems.filter(
				(
					item: RecordType['record'] | null,
				): item is RecordType['record'] => item !== null,
			);
		} catch (error) {
			console.error(
				`Error parsing localStorage data for key "${this.storageKey}":`,
				error,
			);
			return [];
		}
	}

	protected override setRaw(items: RecordType['record'][]): void {
		try {
			localStorage.setItem(this.storageKey, JSON.stringify(items));
		} catch (error) {
			console.error(
				`Error setting localStorage data for key "${this.storageKey}":`,
				error,
			);
		}
	}
}
