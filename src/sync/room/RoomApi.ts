import type { BehaviorSubject } from 'rxjs';

import type { Collection, DocumentApi } from '@/db/Collection';
import type { CreatureRecordType } from '@/db/record/Creature';
import type { EncounterRecordType } from '@/db/record/Encounter';
import type { InitiativeTableEntryRecord } from '@/db/record/InitiativeTableEntry';
import type { AnyRecordType } from '@/db/RecordType';
import type { MemberRecordType } from '@/sync/room/member/Record';
import type { RoomMetaRecordType } from '@/sync/room/RoomMeta';
import type { MemberId, RoomCode } from '@/sync/room/types';
import type { InitiativeTableEntryApi } from '@/type/EncounterApi';
import type EncounterApi from '@/type/EncounterApi';

export default interface RoomApi {
	readonly me: DocumentApi<MemberRecordType>;
	readonly meta: DocumentApi<RoomMetaRecordType>;

	readonly code$: BehaviorSubject<RoomCode | null>;

	readonly db: DndDb;

	readonly presence$: BehaviorSubject<ReadonlyMap<MemberId, boolean>>;
}

export type DndDb = Db<{
	creature: Collection<CreatureRecordType, DocumentApi<CreatureRecordType>>;
	member: Collection<MemberRecordType, DocumentApi<MemberRecordType>>;
	encounter: Collection<EncounterRecordType, EncounterApi>;
	initiativeTableEntry: Collection<
		InitiativeTableEntryRecord,
		InitiativeTableEntryApi
	>;
	roomMeta: Collection<RoomMetaRecordType, DocumentApi<RoomMetaRecordType>>;
}>;

export class Db<
	Collections extends Record<string, Collection<AnyRecordType, unknown>>,
> {
	private readonly collections: Partial<Collections> = {};

	constructor();
	constructor(initialCollections: {
		[Name in keyof Collections]: (db: Db<Collections>) => Collections[Name];
	});

	constructor(initialCollections?: {
		[Name in keyof Collections]: (db: Db<Collections>) => Collections[Name];
	}) {
		if (initialCollections)
			Object.entries(initialCollections).forEach(([name, factory]) =>
				this.register(name, factory),
			);
	}

	register<Name extends keyof Collections>(
		name: Name,
		collectionFactory: (db: this) => Collections[Name],
	): void {
		if (this.collections[name])
			throw new Error(
				`Collection ${name.toString()} defined more than once`,
			);

		this.collections[name] = collectionFactory(this);
	}

	get<Name extends keyof Collections>(name: Name): Collections[Name] {
		if (!this.collections[name])
			throw new Error(`Collection ${name.toString()} not yet defined`);

		return this.collections[name];
	}
}
