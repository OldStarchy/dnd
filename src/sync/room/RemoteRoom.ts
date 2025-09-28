import { BehaviorSubject } from 'rxjs';

import type { DocumentApi, ReadonlyDocumentApi } from '@/db/Collection';
import { type CreatureRecordType, creatureSchema } from '@/db/record/Creature';
import {
	type EncounterRecordType,
	encounterSchema,
} from '@/db/record/Encounter';
import {
	type InitiativeTableEntryRecord,
	initiativeTableEntrySchema,
} from '@/db/record/InitiativeTableEntry';
import { traceAsync } from '@/decorators/trace';
import { setJsonStorage } from '@/hooks/useJsonStorage';
import Logger from '@/lib/log';
import RemoteCollection from '@/sync/db/RemoteCollection';
import { type MemberRecordType, memberSchema } from '@/sync/room/member/Record';
import type RoomApi from '@/sync/room/RoomApi';
import type RoomHost from '@/sync/room/RoomHost';
import type RoomHostConnection from '@/sync/room/RoomHostConnection';
import { type RoomMetaRecordType, roomMetaSchema } from '@/sync/room/RoomMeta';
import type { MembershipToken, RoomCode } from '@/sync/room/types';

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
				return await new RemoteCollection<RoomMetaRecordType>(
					connection,
					'room',
					roomMetaSchema,
				)
					.getOne()
					.okOr('missing_room_meta' as const)
					.andTry(async (meta) => {
						const room = await RemoteRoom.construct(
							roomHost,
							membershipToken,
							connection,
							meta,
						);

						setJsonStorage('roomSession', {
							lastRoom: {
								type: 'joined',
								host: roomHost.host,
								membershipToken,
								code: room.code$.value!,
								name: meta.data.value.name,
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
		readonly meta: ReadonlyDocumentApi<RoomMetaRecordType>,
		readonly db: RoomApi['db'],
	) {
		this.code$.next(connection.roomCode);
	}

	private static async construct(
		roomHost: RoomHost,
		membershipToken: MembershipToken,
		connection: RoomHostConnection,
		meta: ReadonlyDocumentApi<RoomMetaRecordType>,
	) {
		const creature = new RemoteCollection<CreatureRecordType>(
			connection,
			'creature',
			creatureSchema,
		);
		const member = new RemoteCollection<MemberRecordType>(
			connection,
			'member',
			memberSchema,
		);

		const encounter = new RemoteCollection<EncounterRecordType>(
			connection,
			'encounter',
			encounterSchema,
		);

		const initiativeTableEntry =
			new RemoteCollection<InitiativeTableEntryRecord>(
				connection,
				'initiativeTableEntry',
				initiativeTableEntrySchema,
			);

		const me = await member
			.getOne({ identity: connection.id })
			.unwrap('Failed to retrieve member information for self');

		return new RemoteRoom(roomHost, connection, me, membershipToken, meta, {
			creature,
			member,
			encounter,
			initiativeTableEntry,
		});
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
