import { RemoteClient } from '@/sync/RemoteClient';
import { useMemo } from 'react';
import useTransport from './context/useTransport';

export default function useClient() {
	const transportFactory = useTransport();

	const client = useMemo(() => {
		if (transportFactory === null) {
			return null;
		}

		return new RemoteClient(transportFactory);
	}, [transportFactory]);

	return client;
}
