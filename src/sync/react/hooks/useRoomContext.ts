import { RoomContext } from '@/sync/react/context/RoomContext';
import { useContext } from 'react';

export default function useRoomContext() {
	return useContext(RoomContext);
}
