import type {
	Collection,
	DocumentApi,
	ReadonlyDocumentApi,
} from '@/db/Collection';
import { traceAsync } from '@/decorators/trace';
import Logger from '@/lib/log';
import RemoteCollection from '@/sync/db/RemoteCollection';
import { memberSchema, type MemberRecordType } from '@/sync/room/member/Record';
import type RoomApi from '@/sync/room/RoomApi';
import type RoomHost from '@/sync/room/RoomHost';
import RoomHostConnection from '@/sync/room/RoomHostConnection';
import { roomMetaSchema, type RoomMetaRecordType } from '@/sync/room/RoomMeta';
import type { MembershipToken, RoomCode } from '@/sync/room/types';
import { creatureSchema, type CreatureRecordType } from '@/type/Creature';

export default class RemoteRoom implements RoomApi {
	@traceAsync(Logger.INFO)
	static async join(
		roomHost: RoomHost,
		roomCode: RoomCode,
	): Promise<RemoteRoom> {
		const result = await roomHost.room.join(roomCode);

		const membershipToken = result.membershipToken as MembershipToken;

		return await this.reconnect(roomHost, membershipToken);
	}

	@traceAsync(Logger.INFO)
	static async reconnect(
		roomHost: RoomHost,
		membershipToken: MembershipToken,
	): Promise<RemoteRoom> {
		const connection = await roomHost.room.connect(membershipToken);

		const meta = await new RemoteCollection<RoomMetaRecordType>(
			connection,
			'room',
			roomMetaSchema,
		)
			.getOne()
			.unwrap('Failed to retrieve room metadata for room');

		return await RemoteRoom.construct(membershipToken, connection, meta);
	}

	static async joinPort(port: MessagePort): Promise<RemoteRoom> {
		// TODO:
	}

	private constructor(
		readonly me: DocumentApi<MemberRecordType>,
		readonly membershipToken: MembershipToken,
		readonly meta: ReadonlyDocumentApi<RoomMetaRecordType>,
		readonly creatures: Collection<CreatureRecordType>,
		readonly members: Collection<MemberRecordType>,
	) {}

	private static async construct(
		membershipToken: MembershipToken,
		connection: RoomHostConnection,
		meta: ReadonlyDocumentApi<RoomMetaRecordType>,
	) {
		const creatures = new RemoteCollection<CreatureRecordType>(
			connection,
			'creature',
			creatureSchema,
		);
		const members = new RemoteCollection<MemberRecordType>(
			connection,
			'member',
			memberSchema,
		);

		const me = await members
			.getOne({ identity: connection.id })
			.unwrap('Failed to retrieve member information for self');

		return new RemoteRoom(me, membershipToken, meta, creatures, members);
	}
}
