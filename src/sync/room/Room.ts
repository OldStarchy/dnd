import '@/lib/OptionResultInterop';

import { type Collection, type DocumentApi } from '@/db/Collection';
import { LocalStorageCollection } from '@/db/LocalStorageCollection';
import { RamCollection } from '@/db/RamCollection';
import {
	creatureSchema,
	filterCreature,
	type CreatureRecordType,
} from '@/db/record/Creature';
import {
	encounterFilter,
	encounterSchema,
	type EncounterRecordType,
} from '@/db/record/Encounter';
import {
	initiativeTableEntryFilter,
	initiativeTableEntrySchema,
	type InitiativeTableEntryRecord,
} from '@/db/record/InitiativeTableEntry';
import autoSubject from '@/decorators/autoSubject';
import { traceAsync } from '@/decorators/trace';
import { setJsonStorage } from '@/hooks/useJsonStorage';
import Logger from '@/lib/log';
import { Err, Ok } from '@/lib/Result';
import { BehaviorSubject, map, of, switchMap } from 'rxjs';
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
import type { MemberId, MembershipToken, RoomCode } from './types';

export default class Room implements RoomApi {
	private static rooms: Collection<RoomMetaRecordType>;
	static {
		this.rooms = new LocalStorageCollection<RoomMetaRecordType>(
			'room',
			(_record, filter) => {
				if (filter !== undefined) throw new Error('NYI');
				return true;
			},
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
		const creatures = new LocalStorageCollection<CreatureRecordType>(
			'creature',
			filterCreature,
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
				initiativeTableEntryFilter,
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

	readonly presence$ = new BehaviorSubject<ReadonlyMap<MemberId, boolean>>(
		new Map(),
	);
}
