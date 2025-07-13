import { ClientContext } from '@/context/ClientContext';
import { useContext } from 'react';

export function useClient() {
	const clientContext = useContext(ClientContext);

	if (!clientContext) {
		throw new Error(
			'useClient must be used within a ClientContext provider',
		);
	}

	return clientContext;
}
