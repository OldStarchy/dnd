import InitiativeTable from '@/components/InitiativeTable/InitiativeTable';
import { MessagePortClient } from '@/sync/MessagePortClient';
import { useEffect, useRef, useState } from 'react';
import type { InitiativeTableEntry } from './InitiativeTable/InitiativeTableEntry';

function PlayerViewPanel() {
	const [initiativeTableEntries, setInitiativeTableEntries] = useState<
		InitiativeTableEntry[]
	>([]);
	const [currentTurnEntityId, setCurrentTurnEntityId] = useState<
		string | null
	>(null);

	const clientRef = useRef<MessagePortClient>(null);
	const heartbeatRef = useRef(0);

	useEffect(() => {
		const messageHandler = (event: MessageEvent) => {
			if (event.data?.type === 'INIT_PORT' && event.ports?.length) {
				const port = event.ports[0];
				port.start();
				const client = new MessagePortClient(port, {
					handleNotification: (update) => {
						switch (update.type) {
							case 'initiative-table-update': {
								setInitiativeTableEntries(update.data);
								break;
							}
							case 'heartbeat': {
								heartbeatRef.current = 0;
								break;
							}
							default: {
								// @ts-expect-error unused
								const _exhaustiveCheck: never = update;
							}
						}
					},
				});

				clientRef.current?.[Symbol.dispose]();
				clientRef.current = client;

				client.notify({ type: 'ready' });
			}
		};
		window.addEventListener('message', messageHandler);

		window.opener?.postMessage('POPUP_READY');
		return () => {
			clientRef.current?.[Symbol.dispose]();
			window.removeEventListener('message', messageHandler);
		};
	}, []);

	useEffect(() => {
		const heartbeatInterval = setInterval(() => {
			clientRef.current?.notify({ type: 'heartbeat' });
			heartbeatRef.current += 1;
			if (heartbeatRef.current === 5) {
				window.opener?.postMessage('POPUP_READY');
			}
			if (heartbeatRef.current > 10) {
				console.warn('Heartbeat timeout, closing popout window');
				window.close();
			}
		}, 1000);

		return () => {
			clearInterval(heartbeatInterval);
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
