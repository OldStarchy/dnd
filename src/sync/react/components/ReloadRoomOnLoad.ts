import { useContext, useEffect, useRef } from 'react';

import useRoomSession from '@/hooks/room/useRoomSession';
import { useLocalConfig } from '@/hooks/useLocalConfig';
import { RoomContext } from '@/sync/react/context/room/RoomContext';
import { RoomActionsContext } from '@/sync/react/context/roomActions/RoomActionsContext';
import RoomHost from '@/sync/room/RoomHost';

export default function ReloadRoomOnLoad() {
	const roomActions = useContext(RoomActionsContext);
	const room = useContext(RoomContext);
	const [session] = useRoomSession();
	const [localConfig] = useLocalConfig();

	const once = useRef(false);

	useEffect(() => {
		if (once.current) return;
		once.current = true;

		if (!localConfig.reconnectOnPageLoad) return;
		if (!roomActions) return;
		if (room) return;
		if (session.lastRoom === null) return;

		const lastRoom = session.lastRoom;
		(async () => {
			if (lastRoom.type === 'hosted') {
				await roomActions.reconnect(
					RoomHost.get(lastRoom.host),
					lastRoom.membershipToken,
				);
			} else if (lastRoom.type === 'joined') {
				await roomActions.rejoin(
					RoomHost.get(lastRoom.host),
					lastRoom.membershipToken,
				);
			}
		})();
	}, [roomActions, room, session.lastRoom, localConfig.reconnectOnPageLoad]);

	return null;
}
