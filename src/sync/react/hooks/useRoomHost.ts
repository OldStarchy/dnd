import { RoomHostContext } from '@/sync/react/context/RoomHostContext';
import type RoomHost from '@/sync/room/RoomHost';
import { useContext } from 'react';

export function useRoomHost(): RoomHost {
	const api = useContext(RoomHostContext);

	if (!api) {
		throw new Error('useRoomHost must be used within a RoomHostProvider');
	}

	return api;
}
