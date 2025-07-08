import { useServerConfig } from '@/hooks/useServerConfig';
import { BackendApi } from '@/sync/BackendApi';
import { createContext, useContext, useMemo, type ReactNode } from 'react';

const BackendApiContext = createContext<BackendApi | null>(null);

export function useBackendApi(): BackendApi {
	const api = useContext(BackendApiContext);
	if (!api) {
		throw new Error(
			'useBackendApi must be used within a BackendApiProvider',
		);
	}
	return api;
}

interface ConfigurableBackendApiProviderProps {
	children: ReactNode;
}

export function ConfigurableBackendApiProvider({
	children,
}: ConfigurableBackendApiProviderProps) {
	const [serverUrl] = useServerConfig();

	const api = useMemo(() => {
		const host = serverUrl || window.location.origin;
		return new BackendApi(host);
	}, [serverUrl]);

	return (
		<BackendApiContext.Provider value={api}>
			{children}
		</BackendApiContext.Provider>
	);
}

export const BackendApiProvider = BackendApiContext.Provider;
