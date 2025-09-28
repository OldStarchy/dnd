import { useContext } from 'react';

import { RoomContext } from '@/sync/react/context/RoomContext';

export default function useRoomContext() {
	return useContext(RoomContext);
}
