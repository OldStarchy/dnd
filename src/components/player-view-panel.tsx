import InitiativeTable from '@/components/initiative-table';
import { useAppDispatch, useAppSelector } from '@/store/store';
import { getObfuscatedHealthText } from '@/store/types/Entity';
import { useEffect, useState } from 'react';

function PlayerViewPanel() {
	const [portFromMain, setPortFromMain] = useState<null | MessagePort>(null);
	const entities = useAppSelector((state) => state.initiative.entities);
	const dispatch = useAppDispatch();

	const entitiesView = entities
		.filter((entity) => entity.visible)
		.map((entity) => {
			const healthDisplay = getObfuscatedHealthText(
				entity.health,
				entity.maxHealth,
				entity.obfuscateHealth,
			);

			return {
				id: entity.id,
				name: entity.name,
				initiative: entity.initiative,
				healthDisplay,
				tags: entity.tags,
			};
		});

	useEffect(() => {
		const messageHandler = (event: MessageEvent) => {
			if (event.data?.type === 'INIT_PORT' && event.ports?.length) {
				const portFromMain = event.ports[0];
				portFromMain.start();
				portFromMain.onmessage = (event: MessageEvent) => {
					const data = event.data as any;
					if (data && data.type === 'FORWARDED_ACTION') {
						dispatch(data.payload);
					}
				};

				setPortFromMain(portFromMain);

				portFromMain.postMessage({
					type: 'INIT_PORT_OK',
				});
			}
		};
		window.addEventListener('message', messageHandler);
		return () => {
			window.removeEventListener('message', messageHandler);
			if (portFromMain) {
				setPortFromMain((prev) => {
					prev?.close();
					return null;
				});
			}
		};
	}, []);
	return (
		<div>
			<InitiativeTable
				entities={entitiesView}
				onClickEntity={() => {}}
				selectedEntityId={null}
			/>
		</div>
	);
}

export default PlayerViewPanel;
