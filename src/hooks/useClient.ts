import { ClientContext } from '@/context/ClientContext';
import type { ClientHandler } from '@/sync/RemoteClient';
import { useContext, useEffect } from 'react';

export function useClient(handler: Partial<ClientHandler> = {}) {
	const clientContext = useContext(ClientContext);

	useEffect(() => {
		if (clientContext) {
			Object.assign(clientContext, handler);
		}
	}, [clientContext, handler]);

	return clientContext;
}
