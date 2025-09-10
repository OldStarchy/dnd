import { RoomActionsContext } from '@/sync/react/context/RoomActionsContext';
import RemoteRoom from '@/sync/room/RemoteRoom';
import Room from '@/sync/room/Room';
import type RoomApi from '@/sync/room/RoomApi';
import { useCallback, useState, type ReactNode } from 'react';
import { filter, take } from 'rxjs';
import { RoomContext } from '../context/RoomContext';

const Provider = RoomActionsContext.Provider;
const RoomProvider = RoomContext.Provider;

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
			return Room.reconnect(...args).then(setRoom);
		},
		[],
	);

	const join = useCallback((...args: Parameters<typeof RemoteRoom.join>) => {
		return RemoteRoom.join(...args).then((room) => {
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
			return RemoteRoom.reconnect(...args).then((room) => {
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
		<Provider value={{ create, reconnect, join, rejoin, close }}>
			<RoomProvider value={room}>{children}</RoomProvider>
		</Provider>
	);
}
