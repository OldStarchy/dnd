import { useServerConfig } from '@/hooks/useServerConfig';
import { RoomHostContext } from '@/sync/react/context/RoomHostContext';
import RoomHost from '@/sync/room/RoomHost';
import { useMemo, type ReactNode } from 'react';

interface ConfigurableBackendApiProviderProps {
	children: ReactNode;
}

export function ConfigurableRoomHostProvider({
	children,
}: ConfigurableBackendApiProviderProps) {
	const [serverUrl] = useServerConfig();

	const api = useMemo(() => {
		const host = serverUrl || `${window.location.origin}/api`;
		return new RoomHost(host);
	}, [serverUrl]);

	return (
		<RoomHostContext.Provider value={api}>
			{children}
		</RoomHostContext.Provider>
	);
}

export const BackendApiProvider = RoomHostContext.Provider;
