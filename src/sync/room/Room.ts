import {
	LocalStorageCollection,
	type Collection,
	type DocumentApi,
} from '@/db/Collection';
import { creatureSchema, type Creature } from '@/type/Creature';
import { memberSchema, type Member } from './Member';
import type RoomHost from './RoomHost';
import { roomMetaSchema, type RoomMeta } from './RoomMeta';
import type RoomPublication from './RoomPublication';
import type { MembershipToken } from './types';

export default class Room {
	static async create(
		meta: Omit<RoomMeta, 'id' | 'revision'>,
	): Promise<Room> {
		const metaColleciton = new LocalStorageCollection(
			'rooms',
			() => true,
			roomMetaSchema,
		);

		const metaDoc = await metaColleciton.create(meta);

		return new Room(metaDoc);
		// TODO:
	}

	static async reconnect(
		roomHostUrl: RoomHost,
		token: MembershipToken,
	): Promise<Room> {
		// TODO:
	}

	readonly meta: DocumentApi<RoomMeta>;
	readonly creatures: Collection<Creature, { id: string } | { name: string }>;
	readonly members: Collection<Member, void>;

	get hosts(): ReadonlyMap<string, RoomPublication> {
		return this._hosts;
	}
	private readonly _hosts: Map<string, RoomPublication>;

	private constructor(meta: DocumentApi<RoomMeta>) {
		this.meta = meta;
		this.creatures = new LocalStorageCollection(
			`creatures`,
			() => true,
			creatureSchema,
		);
		this.members = new LocalStorageCollection(
			`members`,
			() => true,
			memberSchema,
		);

		this._hosts = new Map<string, RoomPublication>();
	}

	async publish(roomHost: RoomHost): Promise<RoomPublication> {
		const publication = await roomHost.publish(this);
		this._hosts.set(roomHost.host, publication);
		// TODO:
		return publication;
	}

	createPortHost(port: MessagePort): void {
		// TODO:
	}
}
