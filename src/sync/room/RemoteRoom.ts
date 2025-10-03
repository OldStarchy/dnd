import { BehaviorSubject } from 'rxjs';

import type { DocumentApi } from '@/db/Collection';
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
import { traceAsync } from '@/decorators/trace';
import { setJsonStorage } from '@/hooks/useJsonStorage';
import Logger from '@/lib/log';
import RemoteCollection from '@/sync/db/RemoteCollection';
import {
	MemberCollectionSchema,
	type MemberRecordType,
} from '@/sync/room/member/Record';
import type RoomApi from '@/sync/room/RoomApi';
import { Db, type DndDb } from '@/sync/room/RoomApi';
import type RoomHost from '@/sync/room/RoomHost';
import type RoomHostConnection from '@/sync/room/RoomHostConnection';
import {
	RoomMetaDocumentDefinition,
	type RoomMetaRecordType,
} from '@/sync/room/RoomMeta';
import type { MembershipToken, RoomCode } from '@/sync/room/types';
import type { InitiativeTableEntryApi } from '@/type/EncounterApi';
import type EncounterApi from '@/type/EncounterApi';

export default class RemoteRoom implements RoomApi {
	@traceAsync(Logger.INFO)
	static join(roomHost: RoomHost, roomCode: RoomCode) {
		return roomHost.room
			.join(roomCode)
			.andThen(async ({ membershipToken }) =>
				this.reconnect(roomHost, membershipToken),
			);
	}

	@traceAsync(Logger.INFO)
	static reconnect(roomHost: RoomHost, membershipToken: MembershipToken) {
		return roomHost.room
			.connect(membershipToken)
			.andThen(async (connection) => {
				const db: DndDb = new Db();

				db.register(
					'roomMeta',
					(db) =>
						new RemoteCollection<RoomMetaRecordType>(
							RoomMetaDocumentDefinition,
							db,
							connection,
						),
				);

				db.register(
					'creature',
					(db) =>
						new RemoteCollection<
							CreatureRecordType,
							DocumentApi<CreatureRecordType>
						>(CreatureCollectionSchema, db, connection),
				);
				db.register(
					'member',
					(db) =>
						new RemoteCollection<
							MemberRecordType,
							DocumentApi<MemberRecordType>
						>(MemberCollectionSchema, db, connection),
				);
				db.register(
					'encounter',
					(db) =>
						new RemoteCollection<EncounterRecordType, EncounterApi>(
							EncounterCollectionSchema,
							db,
							connection,
						),
				);
				db.register(
					'initiativeTableEntry',
					(db) =>
						new RemoteCollection<
							InitiativeTableEntryRecord,
							InitiativeTableEntryApi
						>(InitiativeTableEntryCollectionSchema, db, connection),
				);

				return await db
					.get('roomMeta')
					.getOne()
					.okOr('missing_room_meta' as const)
					.andTry(async (meta) => {
						const room = await RemoteRoom.construct(
							roomHost,
							membershipToken,
							connection,
							meta,
							db,
						);

						setJsonStorage('roomSession', {
							lastRoom: {
								type: 'joined',
								host: roomHost.host,
								membershipToken,
								code: room.code$.value!,
								name: meta.data.name,
							},
						});

						return room;
					})
					.inspectErr((_err) => connection.close());
			})
			.inspectErr((_) => {
				setJsonStorage('roomSession', {
					lastRoom: null,
				});
			});
	}

	static async joinPort(_port: MessagePort): Promise<RemoteRoom> {
		// TODO:
		throw new Error('Not implemented');
	}

	readonly code$ = new BehaviorSubject<RoomCode | null>(null);

	private constructor(
		readonly roomHost: RoomHost,
		readonly connection: RoomHostConnection,
		readonly me: DocumentApi<MemberRecordType>,
		readonly membershipToken: MembershipToken,
		readonly meta: DocumentApi<RoomMetaRecordType>,
		readonly db: DndDb,
	) {
		this.code$.next(connection.roomCode);
	}

	private static async construct(
		roomHost: RoomHost,
		membershipToken: MembershipToken,
		connection: RoomHostConnection,
		meta: DocumentApi<RoomMetaRecordType>,
		db: DndDb,
	) {
		const me = await db
			.get('member')
			.getOne({ identity: connection.id })
			.unwrap('Failed to retrieve member information for self');

		return new RemoteRoom(
			roomHost,
			connection,
			me,
			membershipToken,
			meta,
			db,
		);
	}

	async leave(): Promise<void> {
		setJsonStorage('roomSession', {
			lastRoom: null,
		});
		await this.connection.close();
		await this.connection.host.room.leave(this.membershipToken);
	}

	get presence$() {
		return this.connection.presence$;
	}
}
