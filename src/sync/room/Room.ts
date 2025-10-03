import '@/lib/OptionResultInterop';

import { BehaviorSubject, map, of, switchMap } from 'rxjs';

import type { DocumentApi } from '@/db/Collection';
import { LocalStorageCollection } from '@/db/LocalStorageCollection';
import { RamCollection } from '@/db/RamCollection';
import {
	CreatureCollectionSchema,
	type CreatureRecordType,
} from '@/db/record/Creature';
import {
	EncounterCollectionSchema,
	type EncounterRecordType,
} from '@/db/record/Encounter';
import {
	InitiativeTableEntryCollectionSchema,
	type InitiativeTableEntryRecord,
} from '@/db/record/InitiativeTableEntry';
import autoSubject from '@/decorators/autoSubject';
import { traceAsync } from '@/decorators/trace';
import { setJsonStorage } from '@/hooks/useJsonStorage';
import Logger from '@/lib/log';
import { Err, Ok } from '@/lib/Result';
import { CollectionHost } from '@/sync/db/CollectionHost';
import {
	MemberCollectionSchema,
	type MemberRecordType,
} from '@/sync/room/member/Record';
import type RoomApi from '@/sync/room/RoomApi';
import { Db, type DndDb } from '@/sync/room/RoomApi';
import type RoomHost from '@/sync/room/RoomHost';
import {
	type RoomMeta,
	RoomMetaDocumentDefinition,
	type RoomMetaRecordType,
} from '@/sync/room/RoomMeta';
import RoomPublication from '@/sync/room/RoomPublication';
import type { MemberId, MembershipToken, RoomCode } from '@/sync/room/types';
import type EncounterApi from '@/type/EncounterApi';
import type { InitiativeTableEntryApi } from '@/type/EncounterApi';

export default class Room implements RoomApi {
	private static db: DndDb;
	static {
		const db: DndDb = new Db();

		db.register(
			'creature',
			(db) =>
				new LocalStorageCollection<CreatureRecordType>(
					CreatureCollectionSchema,
					db,
				),
		);

		db.register(
			'encounter',
			(db) =>
				new LocalStorageCollection<EncounterRecordType, EncounterApi>(
					EncounterCollectionSchema,
					db,
				),
		);

		db.register(
			'initiativeTableEntry',
			(db) =>
				new LocalStorageCollection<
					InitiativeTableEntryRecord,
					InitiativeTableEntryApi
				>(InitiativeTableEntryCollectionSchema, db),
		);

		db.register(
			'member',
			(db) =>
				new RamCollection<MemberRecordType>(MemberCollectionSchema, db),
		);

		db.register(
			'roomMeta',
			(db) =>
				new LocalStorageCollection<RoomMetaRecordType>(
					RoomMetaDocumentDefinition,
					db,
				),
		);

		this.db = db;
	}

	static get rooms() {
		return this.db.get('roomMeta');
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
		collections: DndDb,
		hosts: ReadonlyMap<string, RoomPublication>,
	) {
		this.hosts = hosts;
		this.db = collections;
		this.hosts$
			.pipe(
				map(
					(hosts) =>
						Array.from(hosts.values()).at(0)?.roomCode || null,
				),
			)
			.subscribe(this.code$);

		this.hosts$
			.pipe(
				map(
					(hosts) =>
						Array.from(hosts.values()).at(0)?.connection
							.presence$ || null,
				),
				switchMap((value) => value ?? of(new Map())),
			)
			.subscribe(this.presence$);
	}

	@autoSubject()
	private hosts: ReadonlyMap<string, RoomPublication>;
	declare readonly hosts$: BehaviorSubject<
		ReadonlyMap<string, RoomPublication>
	>;

	private static async construct(meta: DocumentApi<RoomMetaRecordType>) {
		const me = await this.db.get('member').create({
			name: 'Game Master',
			identities: [],
		});

		const hosts = new Map<string, RoomPublication>();

		return new Room(me, meta, this.db, hosts);
	}

	@traceAsync(Logger.INFO)
	static reconnect(roomHost: RoomHost, token: MembershipToken) {
		return roomHost.room
			.get(token)
			.inspectErr((error) => {
				if (error === 'not_found' || error === 'invalid_token') {
					setJsonStorage('roomSession', {
						lastRoom: null,
					});
				}
			})
			.andThen(async (info) => {
				const { roomCode } = info;

				const meta = await Room.rooms.getOne();

				if (meta.isNone()) {
					return Err('missing_room_meta' as const);
				}

				const room = await Room.construct(meta.unwrap());
				await room.connect(token, roomCode, roomHost);

				return Ok(room);
			});
	}

	@traceAsync(Logger.INFO)
	publish(roomHost: RoomHost) {
		return roomHost.room
			.create()
			.map(({ membershipToken, roomCode }) =>
				this.connect(membershipToken, roomCode, roomHost),
			);
	}

	private async connect(
		membershipToken: MembershipToken,
		roomCode: RoomCode,
		roomHost: RoomHost,
	): Promise<RoomPublication> {
		const connection = await roomHost.room
			.connect(membershipToken)
			.unwrap();

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
			await this.db
				.get('member')
				.getOne({ identity: member.id })
				.unwrapOrElse(() =>
					this.db.get('member').create({
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

					this.db
						.get('member')
						.getOne({ identity: id })
						.unwrapOrElse(() =>
							this.db.get('member').create({
								name: 'Unnamed player',
								identities: [{ host: roomHost.host, id }],
							}),
						);
				}

				if (msg.type === 'room.members.left') {
					const { id } = msg.data;

					this.db
						.get('member')
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
				name: this.meta.data.name,
				roomId: this.meta.data.id,
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

	readonly presence$ = new BehaviorSubject<ReadonlyMap<MemberId, boolean>>(
		new Map(),
	);
}
