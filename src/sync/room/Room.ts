import { type Collection, type DocumentApi } from '@/db/Collection';
import { LocalStorageCollection } from '@/db/LocalStorageCollection';
import Logger from '@/lib/log';
import { creatureSchema, type Creature } from '@/type/Creature';
import { Subscription } from 'rxjs';
import { CollectionHost } from '../db/CollectionHost';
import { memberSchema, type Member } from './Member';
import type RoomHost from './RoomHost';
import { RoomHostConnectionApiProvider } from './RoomHostConnection';
import { roomMetaSchema, type RoomMeta } from './RoomMeta';
import RoomPublication from './RoomPublication';
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

	readonly meta: DocumentApi<string, RoomMeta, void>;
	readonly creatures: Collection<
		'creature',
		Creature,
		{ id: string } | { name: string }
	>;
	readonly members: Collection<'member', Member, void>;

	get hosts(): ReadonlyMap<string, RoomPublication> {
		return this._hosts;
	}
	private readonly _hosts: Map<string, RoomPublication>;

	private constructor(meta: DocumentApi<string, RoomMeta, void>) {
		this.meta = meta;

		this.creatures = new LocalStorageCollection(
			'creature',
			() => true,
			creatureSchema,
		);
		this.members = new LocalStorageCollection(
			'member',
			() => true,
			memberSchema,
		);

		this._hosts = new Map<string, RoomPublication>();
	}

	static async reconnect(
		roomHost: RoomHost<any>,
		token: MembershipToken,
	): Promise<Room | null> {
		const info = await (async () => {
			try {
				return await roomHost.room.get(token);
			} catch (error) {
				Logger.warn('Failed to reconnect to room:', error);
				return null;
			}
		})();

		if (!info) {
			return null;
		}
		const { id, gameMasterId, roomCode, members } = info;

		const metaCollection = new LocalStorageCollection(
			'room',
			() => true,
			roomMetaSchema,
		);
		const meta = await metaCollection.getOne();
		if (!meta) {
			throw new Error('Room meta not found');
		}
		const room = new Room(meta);
		room.connect(id, token, roomCode, roomHost);

		return room;
	}

	async publish(roomHost: RoomHost<any>): Promise<RoomPublication> {
		Logger.info(`Publishing room to ${roomHost.host}`);

		const { id, membershipToken, roomCode } = await roomHost.room.create();
		Logger.info(`Room created with Code: ${roomCode}, `);

		return await this.connect(id, membershipToken, roomCode, roomHost);
	}

	private async connect(
		id: string,
		membershipToken: MembershipToken,
		roomCode: string,
		roomHost: RoomHost<any>,
	): Promise<RoomPublication> {
		const connection = await roomHost.room.connect(membershipToken);

		const apiAdapter = new RoomHostConnectionApiProvider<any, any, any>(
			connection,
		);

		const roomMetaHost = new CollectionHost(this.meta.collection);
		const creaturesHost = new CollectionHost(this.creatures);
		const membersHost = new CollectionHost(this.members);

		const providers = new Subscription();
		providers.add(roomMetaHost.provide(apiAdapter));
		providers.add(creaturesHost.provide(apiAdapter));
		providers.add(membersHost.provide(apiAdapter));

		const publication = new RoomPublication(
			id,
			membershipToken,
			roomCode,
			roomHost,
			providers,
		);
		this._hosts.set(roomHost.host, publication);

		return publication;
	}

	createPortHost(port: MessagePort): void {
		// TODO:
	}
}
