import { useContext } from 'react';

import { RoomActionsContext } from '@/sync/react/context/RoomActionsContext';

export default function useRoomActionsContext() {
	const context = useContext(RoomActionsContext);

	if (!context) {
		throw new Error(
			'useRoomActionsContext must be used within a RoomActionsContextProvider',
		);
	}
	return context;
}
