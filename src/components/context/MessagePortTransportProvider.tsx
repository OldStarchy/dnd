import { TransportContext } from '@/context/TransportContext';
import { PortTransport } from '@/sync/transports/PortTransport';
import type {
	TransportFactory,
	TransportHandler,
} from '@/sync/transports/Transport';
import { DND_CONNECT, DND_PLEASE_RECONNECT } from '@/sync/windowMessage';
import { useEffect, useMemo, useState } from 'react';

export function MessagePortTransportProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [port, setPort] = useState<MessagePort | null>(null);
	useEffect(() => {
		const messageHandler = (event: MessageEvent) => {
			if (event.data?.type === DND_CONNECT && event.ports?.length) {
				const port = event.ports[0];
				port.start();
				setPort(port);
			}
		};
		window.addEventListener('message', messageHandler);
		window.opener?.postMessage({ type: DND_PLEASE_RECONNECT });

		return () => {
			window.removeEventListener('message', messageHandler);
		};
	}, []);

	const transport = useMemo<TransportFactory<string> | null>(() => {
		if (!port) return null;

		port.start();
		const transport = (handler: TransportHandler) =>
			new PortTransport(port, handler);

		return transport;
	}, [port]);

	return (
		<TransportContext.Provider value={transport}>
			{children}
		</TransportContext.Provider>
	);
}
