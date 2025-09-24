import { useLocalConfig } from '@/hooks/useLocalConfig';
import { RoomHostContext } from '@/sync/react/context/RoomHostContext';
import RoomHost from '@/sync/room/RoomHost';
import { useMemo, type ReactNode } from 'react';

interface ConfigurableBackendApiProviderProps {
	children: ReactNode;
}

export function RoomHostContextProvider({
	children,
}: ConfigurableBackendApiProviderProps) {
	const [localConfig] = useLocalConfig();

	const api = useMemo(() => {
		const host = localConfig.hostUrl || `${window.location.origin}/api`;
		return RoomHost.get(host);
	}, [localConfig.hostUrl]);

	return (
		<RoomHostContext.Provider value={api}>
			{children}
		</RoomHostContext.Provider>
	);
}

export const BackendApiProvider = RoomHostContext.Provider;
