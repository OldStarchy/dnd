/*
import InitiativeTable from '@/components/InitiativeTable/InitiativeTable';
import { setCurrentTurnEntityId } from '@/store/reducers/initiativeSlice';
import useRoomContext from '@/sync/react/hooks/useRoomContext';
import { useEffect, useState } from 'react';
import type { InitiativeTableEntry } from '../db/record/InitiativeTableEntry';

function PlayerViewPanel() {
	const [initiativeTableEntries, setInitiativeTableEntries] = useState<
		InitiativeTableEntry[]
	>([]);
	const [currentTurnEntityId, _setCurrentTurnEntityId] = useState<
		string | null
	>(null);

	const room = useRoomContext();

	useEffect(() => {
		return room?.notification$.on((update) => {
			switch (update.type) {
				case 'initiativeTableUpdate': {
					setInitiativeTableEntries(update.data.entries);
					setCurrentTurnEntityId(update.data.currentTurnId);
					break;
				}
			}
		});
	}, [client]);

	return (
		<div>
			<InitiativeTable
				fieldVisibility={{
					initiative: true,
					name: true,
					race: false,
					ac: false,
					health: true,
					debuffs: true,
					description: true,
				}}
				entries={initiativeTableEntries}
				currentTurnEntityId={currentTurnEntityId}
			/>
		</div>
	);
}

export default PlayerViewPanel;
*/
