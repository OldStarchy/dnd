import { useBackendApi } from '@/hooks/useBackendApi';
import useLocalStorage from '@/hooks/useLocalStorage';
import { type ServerMessageHandler } from '@/sync/Client';
import { MessagePortClient } from '@/sync/MessagePortClient';
import { WebsocketClient } from '@/sync/WebsocketClient';
import {
	createContext,
	useContext,
	useEffect,
	useRef,
	type ReactNode,
} from 'react';

const ClientContext = createContext<Partial<ServerMessageHandler> | null>(null);

export function MessagePortClientProvider({
	children,
}: {
	children: ReactNode;
}) {
	const clientRef = useRef<MessagePortClient>(null);
	const handler = useRef<Partial<ServerMessageHandler>>({});
	const heartbeatRef = useRef(0);

	useEffect(() => {
		const messageHandler = (event: MessageEvent) => {
			if (event.data?.type === 'INIT_PORT' && event.ports?.length) {
				const port = event.ports[0];
				port.start();
				const client = new MessagePortClient(port, {
					handleNotification(update) {
						switch (update.type) {
							case 'heartbeat': {
								heartbeatRef.current = 0;
								break;
							}
						}

						handler.current.handleNotification?.call(this, update);
					},
					handleSystemMessage(message) {
						handler.current.handleSystemMessage?.call(
							this,
							message,
						);
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
		<ClientContext.Provider value={handler.current}>
			{children}
		</ClientContext.Provider>
	);
}

export function WebsocketClientProvider({ children }: { children: ReactNode }) {
	const backendApi = useBackendApi();
	const [token] = useLocalStorage('connectionToken');
	const clientRef = useRef<WebsocketClient>(null);
	const handler = useRef<Partial<ServerMessageHandler>>({});
	const heartbeatRef = useRef(0);

	useEffect(() => {
		if (clientRef.current || !token) return;

		const client = new WebsocketClient(backendApi.connectToRoom(token), {
			handleNotification(update) {
				switch (update.type) {
					case 'heartbeat': {
						heartbeatRef.current = 0;
						break;
					}
				}

				handler.current.handleNotification?.call(this, update);
			},
			handleSystemMessage(message) {
				handler.current.handleSystemMessage?.call(this, message);
			},
		});

		clientRef.current = client;

		client.notify({ type: 'ready' });
	}, [token, backendApi]);

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
		<ClientContext.Provider value={handler.current}>
			{children}
		</ClientContext.Provider>
	);
}

export function useClient(handler: Partial<ServerMessageHandler> = {}) {
	const context = useContext(ClientContext);

	if (!context) {
		throw new Error('useClient must be used within a ClientProvider');
	}

	if (Object.keys(handler).length > 0) {
		// TODO: don't do this
		Object.assign(context, handler);
	}
}
