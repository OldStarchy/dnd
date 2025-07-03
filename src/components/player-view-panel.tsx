import InitiativeTable from '@/components/InitiativeTable/InitiativeTable';
import { PopoutClient } from '@/sync/PopoutClient';
import { useEffect, useRef, useState } from 'react';
import type { InitiativeTableEntry } from './InitiativeTable/InitiativeTableEntry';

function PlayerViewPanel() {
	const [initiativeTableEntries, setInitiativeTableEntries] = useState<
		InitiativeTableEntry[]
	>([]);
	const [currentTurnEntityId, setCurrentTurnEntityId] = useState<
		string | null
	>(null);

	const clientRef = useRef<PopoutClient>(null);

	useEffect(() => {
		clientRef.current?.[Symbol.dispose]();
		clientRef.current = new PopoutClient({
			handleNotification: (update) => {
				switch (update.type) {
					case 'initiative-table-update': {
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

		clientRef.current.onConnectionTimeout = () => {
			alert(
				'Connection to the main window timed out. Please refresh the page to try again.',
			);
			window.close();
		};
	}, []);

	return (
		<div>
			<InitiativeTable
				entries={initiativeTableEntries}
				currentTurnEntityId={currentTurnEntityId}
			/>
		</div>
	);
}

export default PlayerViewPanel;
