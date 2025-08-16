import type {
	Collection,
	DocumentApi,
	ReadonlyDocumentApi,
} from '@/db/Collection';
import type { CreatureRecordType } from '@/type/Creature';
import type { MemberRecordType } from './member/Record';
import type { RoomMetaRecordType } from './RoomMeta';

export default interface RoomApi {
	readonly me: DocumentApi<MemberRecordType>;
	readonly meta: ReadonlyDocumentApi<RoomMetaRecordType>;
	readonly creatures: Collection<CreatureRecordType>;
	readonly members: Collection<MemberRecordType>;
}
