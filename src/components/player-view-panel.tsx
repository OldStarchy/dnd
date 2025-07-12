import InitiativeTable from '@/components/InitiativeTable/InitiativeTable';
import { useClient } from '@/hooks/useClient';
import { useState } from 'react';
import type { InitiativeTableEntry } from './InitiativeTable/InitiativeTableEntry';

function PlayerViewPanel() {
	const [initiativeTableEntries, setInitiativeTableEntries] = useState<
		InitiativeTableEntry[]
	>([]);
	const [currentTurnEntityId, _setCurrentTurnEntityId] = useState<
		string | null
	>(null);

	useClient({
		handleNotification: (update) => {
			switch (update.type) {
				case 'initiativeTableUpdate': {
					setInitiativeTableEntries(update.data);
					break;
				}
				default: {
					// @ts-expect-error unused
					const _exhaustiveCheck: never = update;
				}
			}
		},
	});

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
