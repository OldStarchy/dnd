import InitiativeTable from '@/components/initiative-table';
import { store, useAppDispatch, useAppSelector } from '@/store/store';
import { useEffect, useState } from 'react';
import { Provider } from 'react-redux';

function PopoutView() {
	return (
		<Provider store={store}>
			<PopoutApp />
		</Provider>
	);
}

function PopoutApp() {
	const [portFromMain, setPortFromMain] = useState<null | MessagePort>(null);
	const dispatch = useAppDispatch();

	useEffect(() => {
		const messageHandler = (event: MessageEvent) => {
			if (event.data?.type === 'INIT_PORT' && event.ports?.length) {
				const portFromMain = event.ports[0];
				portFromMain.start();
				portFromMain.onmessage = (event: MessageEvent) => {
					const data = event.data as any;
					console.log(data);
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
				setSelectedEntityId={() => {}}
				selectedEntityId={null}
			/>
		</div>
	);
}

export default PopoutView;
