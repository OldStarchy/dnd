import type {
	Collection,
	DocumentApi,
	ReadonlyCollection,
	ReadonlyDocumentApi,
} from '@/db/Collection';
import type { Creature } from '@/type/Creature';
import {
	DbRequestMessages,
	type DbNotificationMessages,
	type DbResponseMessages,
} from '../db/Messages';
import RemoteCollection, {
	type RemoteCollectionMessages,
} from '../db/RemoteCollection';
import type { Member } from './Member';
import type RoomHost from './RoomHost';
import RoomHostConnection, {
	RoomHostConnectionApiProvider,
} from './RoomHostConnection';
import type { RoomMeta } from './RoomMeta';
import type { MembershipToken, RoomCode } from './types';

type DbTypes = Creature | Member | RoomMeta;

export default class RemoteRoom<
	TUserMessage extends RemoteCollectionMessages<DbTypes>,
> {
	static async join<TUserMessage extends RemoteCollectionMessages<DbTypes>>(
		roomHost: RoomHost,
		roomCode: RoomCode,
	): Promise<RemoteRoom<TUserMessage>> {
		const result = await roomHost.room.join(roomCode);

		const membershipToken = result.membershipToken as MembershipToken;
		const connection =
			await roomHost.room.connect<TUserMessage>(membershipToken);

		const room = new RemoteRoom<TUserMessage>(connection, membershipToken);

		return room;
	}

	static async reconnect<TUserMessage>(
		roomHost: RoomHost,
		token: MembershipToken,
	): Promise<RemoteRoom<TUserMessage>> {
		// TODO:
	}

	static async joinPort(port: MessagePort): Promise<RemoteRoom> {
		// TODO:
	}

	readonly meta: ReadonlyDocumentApi<
		RoomMeta,
		ReadonlyCollection<RoomMeta, void>
	>;
	readonly creatures: Collection<Creature, { id: string } | { name: string }>;
	readonly members: Collection<Member, void>;

	readonly membershipToken: MembershipToken;

	private constructor(
		connection: RoomHostConnection<RemoteCollectionMessages<DbTypes>>,
		membershipToken: MembershipToken,
	) {
		this.membershipToken = membershipToken;

		const remoteApi = new RoomHostConnectionApiProvider<
			DbRequestMessages<DbTypes>,
			DbResponseMessages<DbTypes>,
			DbNotificationMessages<DbTypes>
		>(connection);

		this.meta = new RemoteCollection(remoteApi, 'rooms');
		roomHost.db.getCollection<RoomMeta>('rooms').getOne();
		this.creatures = roomHost.db.getCollection<Creature>('creatures');
		this.members = roomHost.db.getCollection<Member>('members');
	}
}

interface DndRoom {
	readonly meta: DocumentApi<RoomMeta>;
	readonly creatures: Collection<Creature, { id: string } | { name: string }>;
	readonly members: Collection<Member, void>;
}
