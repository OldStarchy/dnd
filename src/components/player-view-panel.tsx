import InitiativeTable from '@/components/InitiativeTable/InitiativeTable';
import useClient from '@/hooks/useClient';
import { setCurrentTurnEntityId } from '@/store/reducers/initiativeSlice';
import { useEffect, useState } from 'react';
import type { InitiativeTableEntry } from './InitiativeTable/InitiativeTableEntry';
import RemoteCreatureListProvider from './context/RemoteCreatureListProvider';

function PlayerViewPanel() {
	const [initiativeTableEntries, setInitiativeTableEntries] = useState<
		InitiativeTableEntry[]
	>([]);
	const [currentTurnEntityId, _setCurrentTurnEntityId] = useState<
		string | null
	>(null);

	const client = useClient();

	useEffect(() => {
		return client?.$notification.on((update) => {
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
			<RemoteCreatureListProvider>
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
			</RemoteCreatureListProvider>
		</div>
	);
}

export default PlayerViewPanel;
