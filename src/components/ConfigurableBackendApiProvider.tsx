import { BackendApiContext } from '@/context/BackendApiContext';
import { useServerConfig } from '@/hooks/useServerConfig';
import { BackendApi } from '@/sync/BackendApi';
import { useMemo, type ReactNode } from 'react';

interface ConfigurableBackendApiProviderProps {
	children: ReactNode;
}

export function ConfigurableBackendApiProvider({
	children,
}: ConfigurableBackendApiProviderProps) {
	const [serverUrl] = useServerConfig();

	const api = useMemo(() => {
		const host = serverUrl || `${window.location.origin}/api`;
		return new BackendApi(host);
	}, [serverUrl]);

	return (
		<BackendApiContext.Provider value={api}>
			{children}
		</BackendApiContext.Provider>
	);
}

export const BackendApiProvider = BackendApiContext.Provider;
