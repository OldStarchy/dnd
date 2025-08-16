import { RoomActionsContext } from '@/sync/react/context/RoomActionsContext';
import { useContext } from 'react';

export default function useRoomActionsContext() {
	const context = useContext(RoomActionsContext);

	if (!context) {
		throw new Error(
			'useRoomActionsContext must be used within a RoomActionsContextProvider',
		);
	}
	return context;
}
