import { ShareContext } from '@/context/ShareContext';
import { TranpsortContext } from '@/context/TransportContext';
import { useBackendApi } from '@/hooks/context/useBackendApi';
import { useSessionToken } from '@/hooks/useSessionToken';
import type { TransportFactory, TransportHandler } from '@/sync/Transport';
import { WebSocketTransport } from '@/sync/transports/WebSocketTransport';
import { useEffect, useState } from 'react';

export function MessagePortTransportProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const [roomCode, setRoomCode] = useState<string | null>(null);
	const [connectionToken, setConnectionToken] = useSessionToken();
	const backendApi = useBackendApi();

	const [transportFactory, setTransportFactory] =
		useState<TransportFactory<string> | null>(null);

	useEffect(() => {
		if (!connectionToken) {
			setTransportFactory(null);
			return () => {};
		}

		const abort = new AbortController();

		(async () => {
			try {
				const { roomCode } = await backendApi.getRoom(connectionToken);

				if (abort.signal.aborted) {
					throw '';
				}
				setRoomCode(roomCode);

				const transportFactory = (handler: TransportHandler<string>) =>
					new WebSocketTransport(
						backendApi.connectToRoom(connectionToken),
						handler,
					);

				setTransportFactory(transportFactory);
			} catch (error) {
				console.error('Failed to initialize transport:', error);
				setTransportFactory(null);
				setConnectionToken(null);
				setRoomCode(null);
			}
		})();

		return () => {
			abort.abort();
		};
	}, [backendApi, connectionToken, setConnectionToken]);

	return (
		<TranpsortContext.Provider value={transportFactory}>
			<ShareContext.Provider value={roomCode}>
				{children}
			</ShareContext.Provider>
		</TranpsortContext.Provider>
	);
}
