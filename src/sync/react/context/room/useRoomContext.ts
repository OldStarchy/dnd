import { useContext } from 'react';

import { RoomContext } from '@/sync/react/context/room/RoomContext';

export default function useRoomContext() {
	return useContext(RoomContext);
}
