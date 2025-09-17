import { type Collection, type DocumentApi } from '@/db/Collection';
import { LocalStorageCollection } from '@/db/LocalStorageCollection';
import { RamCollection } from '@/db/RamCollection';
import { creatureSchema, type CreatureRecordType } from '@/db/record/Creature';
import {
	encounterFilter,
	encounterSchema,
	type EncounterRecordType,
} from '@/db/record/Encounter';
import {
	initiativeTableEntrySchema,
	type InitiativeTableEntryRecord,
} from '@/db/record/InitiativeTableEntry';
import autoSubject from '@/decorators/autoSubject';
import { traceAsync } from '@/decorators/trace';
import { setJsonStorage } from '@/hooks/useJsonStorage';
import Logger from '@/lib/log';
import { BehaviorSubject, map } from 'rxjs';
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

		const room = await Room.construct(metaDoc);

		return room;
	}

	readonly db: RoomApi['db'];
	readonly code$ = new BehaviorSubject<RoomCode | null>(null);

	constructor(
		readonly me: DocumentApi<MemberRecordType>,
		readonly meta: DocumentApi<RoomMetaRecordType>,
		collections: {
			creatures: Collection<CreatureRecordType>;
			encounters: Collection<EncounterRecordType>;
			initiativeTableEntries: Collection<InitiativeTableEntryRecord>;
			members: Collection<MemberRecordType>;
		},
		hosts: ReadonlyMap<string, RoomPublication>,
	) {
		this.hosts = hosts;
		this.db = {
			creature: collections.creatures,
			member: collections.members,
			encounter: collections.encounters,
			initiativeTableEntry: collections.initiativeTableEntries,
		};
		this.hosts$
			.pipe(
				map(
					(hosts) =>
						Array.from(hosts.values()).at(0)?.roomCode || null,
				),
			)
			.subscribe(this.code$);
	}

	@autoSubject()
	private hosts: ReadonlyMap<string, RoomPublication>;
	declare readonly hosts$: BehaviorSubject<
		ReadonlyMap<string, RoomPublication>
	>;

	private static async construct(meta: DocumentApi<RoomMetaRecordType>) {
		const creatures = new LocalStorageCollection<CreatureRecordType>(
			'creature',
			() => false,
			creatureSchema,
		);

		const encounters = new LocalStorageCollection<EncounterRecordType>(
			'encounter',
			encounterFilter,
			encounterSchema,
		);

		const initiativeTableEntries =
			new LocalStorageCollection<InitiativeTableEntryRecord>(
				'initiativeTableEntry',
				() => false,
				initiativeTableEntrySchema,
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

		return new Room(
			me,
			meta,
			{ creatures, members, encounters, initiativeTableEntries },
			hosts,
		);
	}

	@traceAsync(Logger.INFO)
	static async reconnect(
		roomHost: RoomHost,
		token: MembershipToken,
	): Promise<Room | null> {
		const info = await roomHost.room.get(token);

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

		await this.me.update({
			merge: {
				identities: {
					extend: [
						{
							host: roomHost.host,
							id: connection.id,
						},
					],
				},
			},
		});

		for (const member of connection.getMembers()) {
			await this.db.member
				.getOne({ identity: member.id })
				.unwrapOrElse(() =>
					this.db.member.create({
						name: 'Unnamed player',
						identities: [
							{
								host: roomHost.host,
								id: member.id,
							},
						],
					}),
				);
		}

		const roomMetaHost = new CollectionHost({
			room: Room.rooms,
			...this.db,
		});

		const teardown = roomMetaHost.provide(connection);

		teardown.add(
			connection.systemNotification$.subscribe((msg) => {
				if (msg.type === 'room.members.joined') {
					const { id } = msg.data;

					this.db.member.getOne({ identity: id }).unwrapOrElse(() =>
						this.db.member.create({
							name: 'Unnamed player',
							identities: [{ host: roomHost.host, id }],
						}),
					);
				}

				if (msg.type === 'room.members.left') {
					const { id } = msg.data;

					this.db.member
						.getOne({ identity: id })
						.map((doc) => doc.delete());
				}
			}),
		);

		const publication = new RoomPublication(
			connection.id,
			membershipToken,
			roomCode,
			roomHost,
			connection,
			teardown,
		);
		this.hosts = new Map([
			...this.hosts.entries(),
			[roomHost.host, publication],
		]);

		setJsonStorage('roomSession', {
			lastRoom: {
				type: 'hosted',
				host: roomHost.host,
				membershipToken,
				code: roomCode,
				name: this.meta.data.value.name,
				roomId: this.meta.data.value.id,
			},
		});

		return publication;
	}

	createPortHost(_port: MessagePort): void {
		// TODO:
	}

	async close(): Promise<void> {
		setJsonStorage('roomSession', {
			lastRoom: null,
		});
		this.meta.delete();

		for (const pub of this.hosts.values()) {
			await pub['revoke']();
		}
		this.hosts = new Map();
	}

	get presence$() {
		// TODO: This is just assuming a single host which is fine because only
		// one host is supported right now but its still not good to do this.
		const firstHost = this.hosts.entries().take(1).toArray()[0]?.[1];

		return (
			firstHost?.connection.presence$ ??
			new BehaviorSubject(new Map<string, boolean>())
		);
	}
}
