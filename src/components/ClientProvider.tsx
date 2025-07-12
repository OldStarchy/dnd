import { ClientContext } from '@/context/ClientContext';
import { useBackendApi } from '@/hooks/useBackendApi';
import { useSessionToken } from '@/hooks/useSessionToken';
import { RemoteClient, type ClientHandler } from '@/sync/RemoteClient';
import type { TransportFactory } from '@/sync/Transport';
import type { HostNotification } from '@/sync/host-message/HostNotification';
import { PortTransport } from '@/sync/transports/PortTransport';
import { WebSocketTransport } from '@/sync/transports/WebSocketTransport';
import { DND_CONNECT, DND_PLEASE_RECONNECT } from '@/sync/windowMessage';
import { useEffect, useRef, useState, type ReactNode } from 'react';

export function ClientProvider({
	transportFactory,
	children,
}: {
	transportFactory: TransportFactory<string> | null;
	children: ReactNode;
}) {
	const clientRef = useRef<RemoteClient>(null);
	const handler = useRef<Partial<ClientHandler>>({});
	const heartbeatRef = useRef(0);

	// TODO: Move heartbeat stuff into transports
	useEffect(() => {
		if (transportFactory === null) {
			return;
		}

		const client = new RemoteClient(transportFactory, {
			handleClose() {},
			...handler.current,
			handleNotification(update: HostNotification) {
				switch (update.type) {
					case 'heartbeat': {
						if (heartbeatRef.current > 5) {
							console.warn(
								`Got heartbeat after ${heartbeatRef.current} seconds`,
							);
						}
						heartbeatRef.current = 0;
						break;
					}
				}

				handler.current.handleNotification?.call(this, update);
			},
		});

		clientRef.current?.[Symbol.dispose]();
		clientRef.current = client;

		client.notify({ type: 'ready' });

		return () => {
			clientRef.current?.[Symbol.dispose]();
			clientRef.current = null;
		};
	}, [transportFactory]);

	useEffect(() => {
		const heartbeatInterval = setInterval(() => {
			clientRef.current?.notify({ type: 'heartbeat' });
			heartbeatRef.current += 1;
			if (heartbeatRef.current === 5) {
				console.warn(
					'No response from server for 5 seconds, trying to reconnect...',
				);
			}
		}, 1000);

		return () => {
			clearInterval(heartbeatInterval);
		};
	}, []);

	return (
		<ClientContext.Provider value={handler.current}>
			{children}
		</ClientContext.Provider>
	);
}

export function MessagePortClientProvider({
	children,
}: {
	children: ReactNode;
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

		window.opener?.postMessage(DND_PLEASE_RECONNECT);
		return () => {
			window.removeEventListener('message', messageHandler);
		};
	}, []);

	return (
		<ClientProvider
			transportFactory={
				port && ((handler) => new PortTransport(port, handler))
			}
		>
			{children}
		</ClientProvider>
	);
}

export function WebsocketClientProvider({ children }: { children: ReactNode }) {
	const backendApi = useBackendApi();
	const [token] = useSessionToken();

	return (
		<ClientProvider
			transportFactory={
				token
					? (handler) =>
							new WebSocketTransport(
								backendApi.connectToRoom(token),
								handler,
							)
					: null
			}
		>
			{children}
		</ClientProvider>
	);
}
