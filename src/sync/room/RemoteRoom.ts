import type { Collection, DocumentApi } from '@/db/Collection';
import type { Creature } from '@/type/Creature';
import type { Member } from './Member';
import type RoomHost from './RoomHost';
import type { RoomMeta } from './RoomMeta';
import type { MembershipToken, RoomCode } from './types';

export default class RemoteRoom {
	static async join(
		roomHost: RoomHost,
		roomCode: RoomCode,
	): Promise<RemoteRoom> {
		// TODO:
	}

	static async reconnect(
		roomHost: RoomHost,
		token: MembershipToken,
	): Promise<RemoteRoom> {
		// TODO:
	}

	static async joinPort(port: MessagePort): Promise<RemoteRoom> {
		// TODO:
	}

	readonly meta: DocumentApi<RoomMeta>;
	readonly creatures: Collection<Creature, { id: string } | { name: string }>;
	readonly members: Collection<Member, void>;

	private constructor(roomHost: RoomHost) {
		this.meta = roomHost.db.getCollection<RoomMeta>('rooms').getOne();
		this.creatures = roomHost.db.getCollection<Creature>('creatures');
		this.members = roomHost.db.getCollection<Member>('members');
	}
}
