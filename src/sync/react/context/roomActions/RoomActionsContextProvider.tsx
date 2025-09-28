import { type ReactNode, useCallback, useState } from 'react';
import { filter, take } from 'rxjs';

import { RoomContext } from '@/sync/react/context/room/RoomContext';
import { RoomActionsContext } from '@/sync/react/context/roomActions/RoomActionsContext';
import RemoteRoom from '@/sync/room/RemoteRoom';
import Room from '@/sync/room/Room';
import type RoomApi from '@/sync/room/RoomApi';

import ReloadRoomOnLoad from '../../components/ReloadRoomOnLoad';

export default function RoomActionsContextProvider({
	children,
}: {
	children: ReactNode;
}) {
	const [room, setRoom] = useState<RoomApi | null>(null);

	const create = useCallback((...args: Parameters<typeof Room.create>) => {
		return Room.create(...args).then(setRoom);
	}, []);

	const reconnect = useCallback(
		(...args: Parameters<typeof Room.reconnect>) => {
			return Room.reconnect(...args).map(setRoom);
		},
		[],
	);

	const join = useCallback((...args: Parameters<typeof RemoteRoom.join>) => {
		return RemoteRoom.join(...args).map((room) => {
			setRoom(room);
			room.connection.state$
				.pipe(
					filter((state) => state === 'closed'),
					take(1),
				)
				.subscribe(() => setRoom(null));
		});
	}, []);

	const rejoin = useCallback(
		(...args: Parameters<typeof RemoteRoom.reconnect>) => {
			return RemoteRoom.reconnect(...args).map((room) => {
				setRoom(room);
				room.connection.state$
					.pipe(
						filter((state) => state === 'closed'),
						take(1),
					)
					.subscribe(() => setRoom(null));
			});
		},
		[],
	);

	const close = useCallback(async () => {
		if (room instanceof Room) await room.close();

		if (room instanceof RemoteRoom) await room.leave();

		setRoom(null);
	}, [room]);

	return (
		<RoomActionsContext.Provider
			value={{ create, reconnect, join, rejoin, close }}
		>
			<RoomContext.Provider value={room}>
				<ReloadRoomOnLoad />
				{children}
			</RoomContext.Provider>
		</RoomActionsContext.Provider>
	);
}
