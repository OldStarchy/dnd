import { type Collection, type DocumentApi } from '@/db/Collection';
import { LocalStorageCollection } from '@/db/LocalStorageCollection';
import { RamCollection } from '@/db/RamCollection';
import autoSubject from '@/decorators/autoSubject';
import { traceAsync } from '@/decorators/trace';
import Logger from '@/lib/log';
import { creatureSchema, type CreatureRecordType } from '@/type/Creature';
import { BehaviorSubject } from 'rxjs';
import { CollectionHost } from '../db/CollectionHost';
import {
	filterMember,
	memberSchema,
	type MemberRecordType,
} from './member/Record';
import type RoomApi from './RoomApi';
import type RoomHost from './RoomHost';
import {
	roomMetaSchema,
	type RoomMeta,
	type RoomMetaRecordType,
} from './RoomMeta';
import RoomPublication from './RoomPublication';
import type { MembershipToken, RoomCode } from './types';

export default class Room implements RoomApi {
	private static rooms: Collection<RoomMetaRecordType>;
	static {
		this.rooms = new LocalStorageCollection<RoomMetaRecordType>(
			'room',
			() => true,
			roomMetaSchema,
		);
	}

	static async create(
		meta: Omit<RoomMeta, 'id' | 'revision'>,
	): Promise<Room> {
		const metaDoc = await Room.rooms
			.getOne()
			.inspect((doc) => doc.update({ replace: meta }))
			.unwrapOrElse(() => Room.rooms.create(meta));

		return await Room.construct(metaDoc);
	}

	constructor(
		readonly me: DocumentApi<MemberRecordType>,
		readonly meta: DocumentApi<RoomMetaRecordType>,
		readonly creatures: Collection<CreatureRecordType>,
		readonly members: Collection<MemberRecordType>,
		hosts: ReadonlyMap<string, RoomPublication>,
	) {
		this.hosts = hosts;
	}

	@autoSubject()
	private hosts: ReadonlyMap<string, RoomPublication>;
	declare readonly hosts$: BehaviorSubject<
		ReadonlyMap<string, RoomPublication>
	>;

	private static async construct(meta: DocumentApi<RoomMetaRecordType>) {
		const creatures = new LocalStorageCollection<CreatureRecordType>(
			'creature',
			() => true,
			creatureSchema,
		);

		const members = new RamCollection<MemberRecordType>(
			'member',
			filterMember,
			memberSchema,
		);

		const me = await members.create({
			name: 'Game Master',
			identities: [],
		});

		const hosts = new Map<string, RoomPublication>();

		return new Room(me, meta, creatures, members, hosts);
	}

	@traceAsync(Logger.INFO)
	static async reconnect(
		roomHost: RoomHost,
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
		const { roomCode } = info;

		const meta = await Room.rooms.getOne().unwrap('Room meta not found');
		const room = await Room.construct(meta);
		room.connect(token, roomCode, roomHost);

		return room;
	}

	@traceAsync(Logger.INFO)
	async publish(roomHost: RoomHost): Promise<RoomPublication> {
		Logger.info(`Publishing room to ${roomHost.host}`);

		const { membershipToken, roomCode } = await roomHost.room.create();
		Logger.info(`Room created with Code: ${roomCode}, `);

		return await this.connect(membershipToken, roomCode, roomHost);
	}

	private async connect(
		membershipToken: MembershipToken,
		roomCode: RoomCode,
		roomHost: RoomHost,
	): Promise<RoomPublication> {
		const connection = await roomHost.room.connect(membershipToken);

		for (const member of connection.getMembers()) {
			await this.members
				.getOne({ identity: member.id })
				.unwrapOrElse(() =>
					this.members.create({
						name: 'Unnamed player',
						identities: [{ host: roomHost.host, id: member.id }],
					}),
				);
		}

		this.me.update({
			merge: {
				identities: {
					extend: [{ host: roomHost.host, id: connection.id }],
				},
			},
		});

		const roomMetaHost = new CollectionHost({
			room: Room.rooms,
			creature: this.creatures,
			member: this.members,
		});

		const drop = roomMetaHost.provide(connection);
		const publication = new RoomPublication(
			connection.id,
			membershipToken,
			roomCode,
			roomHost,
			drop,
		);
		this.hosts = new Map([
			...this.hosts.entries(),
			[roomHost.host, publication],
		]);

		connection.systemNotification$.subscribe((msg) => {
			if (msg.type === 'room.members.joined') {
				const { id } = msg.data;

				this.members.getOne({ identity: id }).unwrapOrElse(() =>
					this.members.create({
						name: 'Unnamed player',
						identities: [{ host: roomHost.host, id }],
					}),
				);
			}
		});

		return publication;
	}

	createPortHost(port: MessagePort): void {
		// TODO:
	}

	close(): Promise<void> {
		this.meta.delete();
		return Promise.all(
			[...this.hosts.values()].map((h) => h.revoke()),
		).then(() => {
			this.hosts = new Map();
		});
	}
}
