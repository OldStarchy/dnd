import type {
	Collection,
	DocumentApi,
	ReadonlyDocumentApi,
} from '@/db/Collection';
import type { CreatureRecordType } from '@/db/record/Creature';
import type { EncounterRecordType } from '@/db/record/Encounter';
import type { InitiativeTableEntryRecord } from '@/db/record/InitiativeTableEntry';
import type { BehaviorSubject } from 'rxjs';
import type { MemberRecordType } from './member/Record';
import type { RoomMetaRecordType } from './RoomMeta';
import type { RoomCode } from './types';

export default interface RoomApi {
	readonly me: DocumentApi<MemberRecordType>;
	readonly meta: ReadonlyDocumentApi<RoomMetaRecordType>;

	readonly code$: BehaviorSubject<RoomCode | null>;

	readonly db: {
		readonly creature: Collection<CreatureRecordType>;
		readonly member: Collection<MemberRecordType>;
		readonly encounter: Collection<EncounterRecordType>;
		readonly initiativeTableEntry: Collection<InitiativeTableEntryRecord>;
	};
}
