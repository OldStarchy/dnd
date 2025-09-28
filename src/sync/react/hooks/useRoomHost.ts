import { useContext } from 'react';

import { RoomHostContext } from '@/sync/react/context/RoomHostContext';
import type RoomHost from '@/sync/room/RoomHost';

export function useRoomHost(): RoomHost {
	const api = useContext(RoomHostContext);

	if (!api) {
		throw new Error('useRoomHost must be used within a RoomHostProvider');
	}

	return api;
}
