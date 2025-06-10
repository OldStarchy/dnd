import InitiativeTable from '@/components/initiative-table';
import { useReducedDispatch, useReducedSelector } from '@/store/reduced-store';
import { setCurrentTurnEntityId } from '@/store/reducers/reduced-initiative-slice';
import { useEffect, useRef } from 'react';

function PlayerViewPanel() {
	const portFromMain = useRef<MessagePort>(null);
	const { entities, currentTurnEntityId } = useReducedSelector(
		(state) => state.reducedInitiative,
	);
	const dispatch = useReducedDispatch();

	useEffect(() => {
		dispatch(setCurrentTurnEntityId(null));
		const messageHandler = (event: MessageEvent) => {
			if (event.data?.type === 'INIT_PORT' && event.ports?.length) {
				const port = event.ports[0];
				port.start();
				port.onmessage = (event: MessageEvent) => {
					const data = event.data;
					if (data && data.type === 'FORWARDED_ACTION') {
						dispatch(data.payload);
					}
				};

				portFromMain.current = port;

				port.postMessage({
					type: 'READY',
				});
			}
		};
		window.addEventListener('message', messageHandler);
		return () => {
			window.removeEventListener('message', messageHandler);
			portFromMain.current?.close();
			portFromMain.current = null;
		};
	}, [dispatch]);
	return (
		<div>
			<InitiativeTable
				entities={entities}
				currentTurnEntityId={currentTurnEntityId}
				onClickEntity={() => {}}
				selectedEntityId={null}
			/>
		</div>
	);
}

export default PlayerViewPanel;
