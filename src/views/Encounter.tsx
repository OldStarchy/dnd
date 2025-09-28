import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';

import GameMasterControlPanel from '@/components/game-master-control-panel';
import Typography from '@/components/Typography';
import { PAGES } from '@/const';
import type { DocumentApi } from '@/db/Collection';
import type { EncounterRecordType } from '@/db/record/Encounter';
import useRoomContext from '@/sync/react/context/room/useRoomContext';
import type RoomApi from '@/sync/room/RoomApi';

function Home() {
	const room = useRoomContext();
	if (room === null) {
		return (
			<Typography>
				Please go to the{' '}
				<Link to={PAGES.ROOM_MANAGEMENT.url}>
					{PAGES.ROOM_MANAGEMENT.title}
				</Link>{' '}
				page to create a room.
			</Typography>
		);
	}

	return <EncounterWrapper room={room} />;
}

function EncounterWrapper({ room }: { room: RoomApi }) {
	const [encounter, setEncounter] =
		useState<DocumentApi<EncounterRecordType> | null>(null);

	const loading = useRef(false);
	useEffect(() => {
		if (loading.current) return;

		room.db.encounter
			.getOne()
			.unwrapOrElse(async () => {
				const encounter = await room.db.encounter.create({
					currentTurn: null,
				});

				await room.db.initiativeTableEntry.create({
					encounterId: encounter.data.value.id,
					initiative: 0,
					healthDisplay: 'Living?',
					creature: {
						type: 'generic',
						data: {
							name: 'Steven',
							hp: 10,
							maxHp: 10,
							debuffs: [],
							images: [],
						},
					},
				});
				return encounter;
			})
			.then((encounter) => {
				setEncounter(encounter);
				loading.current = false;
			});
	}, [room]);

	if (!encounter) {
		return <div>Loading encounter...</div>;
	}

	return <GameMasterControlPanel room={room} encounter={encounter} />;
}

export default Home;
